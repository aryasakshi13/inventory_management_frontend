import React, { useState, useEffect, useRef} from 'react';
import axios from 'axios';
import {  X,Layers, Plus, AlertCircle } from 'lucide-react';
import ItemsTable from '../../components/items/ItemsTable';
import AddItemClassModal from '../../components/items/AddItemsModel';

const ItemsDirectory = ({ user, userRole }) => {

      const userOfficeId = user?.officeId || user?.OfficeID;

    const [itemsList, setItemsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');


    // 🟢 NEW FILTER STATES
  const [selectedOffice, setSelectedOffice] = useState(userOfficeId);
  const [selectedOfficeName, setSelectedOfficeName] = useState(
    user?.officeName || user?.OfficeName || ""
    );
    const [selectedItem, setSelectedItem] = useState('all');


    // 🟢 NEW SEARCH INPUT TEXT STATE
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    
    // 🟢 AUXILIARY DROPDOWN STORAGE POOLS
    const [officesDropdown, setOfficesDropdown] = useState([]);
    const [uniqueProductsDropdown, setUniqueProductsDropdown] = useState([]);

    // 🟢 ADD THESE LINES FOR ITEM SEARCH dropdown:
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [isItemDropdownVisible, setIsItemDropdownVisible] = useState(false);

       const initialized = useRef(false);

        useEffect(() => {
            if (!officesDropdown.length || initialized.current) return;

            initialized.current = true;

            const currentOffice = officesDropdown.find(
                office => String(office.ID) === String(userOfficeId)
            );

            if (currentOffice) {
                setSelectedOffice(currentOffice.ID);
                setSelectedOfficeName(currentOffice.OfficeName);
            }
        }, [officesDropdown, userOfficeId]);

    const fetchItemsCatalog = async () => {
        try {
            setIsLoading(true);
            setErrorMsg('');
            // const response = await axios.get('https://inventory-manage-q4yr.onrender.com/api/items', {
            //     withCredentials: true
            // });
             
            const response = await axios.get(`https://inventory-manage-q4yr.onrender.com/api/items?officeId=${selectedOffice}&itemId=${selectedItem}`, {
                withCredentials: true
            });

            if (response.data.success) {
                setItemsList(response.data.data || []);
            }
        } catch (error) {
            console.error("Catalog retrieval failed:", error.message);
            setErrorMsg("Failed to synchronize catalog with storage subsystem port.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItemsCatalog();

    }, [selectedOffice, selectedItem]);


     useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                // 1. Fetch clean offices using your exact /api/offices route!
                // Passing a high limit to ensure we fetch all options for the filter menu dropdown
                const offRes = await axios.get('https://inventory-manage-q4yr.onrender.com/api/branch?limit=1000', { withCredentials: true });
                // if (offRes.data.success) {
                //     setOfficesDropdown(offRes.data.data || []);
                // }

                if (offRes.data && offRes.data.success) {
                    // Ensures fallback to an empty array if data wrapping shifts
                    setOfficesDropdown(offRes.data.data || []);
                }

                // 2. Fetch clean item models directly from itemmaster table catalog
                const itemRes = await axios.get('https://inventory-manage-q4yr.onrender.com/api/items', { withCredentials: true });
                // if (itemRes.data.success) {
                //     setUniqueProductsDropdown(itemRes.data.data || []);
                // }
                

                if (itemRes.data && itemRes.data.success) {
                    // Filter down to unique items only for the dropdown selector options
                    const rawItems = itemRes.data.data || [];
                    const uniqueItemMap = new Map();
                    const cleanDropdownItems = [];
                    
                    rawItems.forEach(item => {
                        if (!uniqueItemMap.has(item.ItemId)) {
                            uniqueItemMap.set(item.ItemId, true);
                            cleanDropdownItems.push(item);
                        }
                    });
                    setUniqueProductsDropdown(cleanDropdownItems);
                }

            } catch (err) {
                console.error("Failed to load clean filter configurations:", err.message);
            }
        };
        loadFilterOptions();
    }, []);

   const filteredOffices = officesDropdown.filter(off => {
        if (userRole === 'branch admin') {
            return String(off.ID) === String(userOfficeId);
        }

        // return String(off.OfficeName || '')
        //     .toLowerCase()
        //     .includes(searchQuery.toLowerCase());

        return String(off.OfficeName || '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
    });

    // 🟢 ADD THIS HIGHLIGHTED BLOCK: Filters items dynamically as the user types
    const filteredItemsOptions = uniqueProductsDropdown.filter(item => 
        String(item.ItemName || '').toLowerCase().includes(itemSearchQuery.toLowerCase())
    );
    
   const isSuperAdmin = userRole === 'admin';

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-gray-50 p-1">

            {/* LIGHT ACTION ROW BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                        <Layers size={16} className="text-blue-600" />
                        Master Product Specifications Directory
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                        Review product classes registered globally alongside real-time calculated total available assets.
                    </p>
                </div>

                 {/* FILTER CONTROLS */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs text-left">
                    
                    {/* Office Filter Dropdown */}
                    <div className="flex flex-col gap-1 relative">
                        <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Office Hub</label>
                       <div className="relative">
                        {/* Search Input Field */}
                        <input
                            type="text"
                            placeholder="🔍 Search Office Hub..."
                             
                            // value={searchQuery}
                            value={isDropdownVisible ? searchQuery : selectedOfficeName}

                             onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsDropdownVisible(true);
                            }}
                            // onFocus={() => document.getElementById('office-dropdown-panel').classList.remove('hidden')}
                            // onBlur={() => setTimeout(() => document.getElementById('office-dropdown-panel').classList.add('hidden'), 200)}

                             onFocus={() => {
                                // setIsDropdownVisible(true);
                                // if (selectedOffice === 'all') setSearchQuery('');
                                
                                setIsDropdownVisible(true);
                                setSearchQuery("");

                            }}
                            onBlur={() => {
                                // Timeout allows clicking the panel item options before it hides
                                setTimeout(() => {
                                    setIsDropdownVisible(false);
                                    // // If no office is chosen, restore current office name text safely
                                    const current = officesDropdown.find(o => String(o.ID) === String(selectedOffice));
                                    setSelectedOfficeName(
                                            current ? current.OfficeName : ""
                                        );
                                    // setSearchQuery(current ? current.OfficeName : '🌐 ALL OFFICES');
                                }, 250);
                            }}
                            className="h-9 px-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-bold outline-none cursor-pointer min-w-[180px] text-xs placeholder-gray-400 focus:bg-white focus:border-blue-500"
                        />
                         
                         {/* REMOVE ICON */}
        {selectedOffice !== 'all' && selectedOfficeName && (
            <button
                type="button"
                onMouseDown={(e) => {
                    e.preventDefault();

                    // restore default admin office
                    const defaultOffice = officesDropdown.find(
                        o => String(o.ID) === String(userOfficeId)
                    );

                    if(defaultOffice){
                        setSelectedOffice(defaultOffice.ID);
                        setSelectedOfficeName(defaultOffice.OfficeName);
                    }

                    setSearchQuery("");
                    setIsDropdownVisible(false);
                }}

                className="
                absolute right-2 top-1/2 -translate-y-1/2
                text-gray-400 hover:text-red-500
                transition
                "
            >
                <X size={14}/>
            </button>
         )}
         </div>



                      {/* Floating Options Panel Overlay */}
                        {isDropdownVisible && (
                            <div className="absolute top-14 left-0 w-full min-w-[240px] bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-gray-50 text-xs">
                                
                            {userRole === 'admin' && (
                                <div 
                                    onMouseDown={() => { 
                                        setSelectedOffice('all'); 
                                        // setSearchQuery('🌐 ALL OFFICES');
                                        //   setSearchQuery(off.OfficeName);
                                        setSelectedOfficeName("🌐 ALL OFFICES");
                                          setSearchQuery("");
                                          setIsDropdownVisible(false);
                                    }}
                                    className="p-2.5 hover:bg-blue-50 cursor-pointer font-bold text-blue-600 uppercase"
                                >
                                    🌐 ALL OFFICES
                               </div>
                            )}
                                
                                {filteredOffices.length > 0 ? (
                                    filteredOffices.map(off => (
                                        <div 
                                            key={off.ID}
                                            onMouseDown={() => { 
                                                // setSelectedOffice(off.ID); 
                                                // setSearchQuery(off.OfficeName);

                                                setSelectedOffice(off.ID);
                                                setSelectedOfficeName(off.OfficeName);
                                                setSearchQuery("");
                                                setIsDropdownVisible(false);
                                            }}
                                            className="p-2.5 hover:bg-gray-100 cursor-pointer font-semibold uppercase text-gray-700 transition-colors"
                                        >
                                            {off.OfficeName}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-2.5 text-gray-400 font-medium italic text-center">
                                        No matching offices found
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                      {/* 🟢 REPLACE OLD ITEM FILTER DROPDOWN SCOPE WITH THIS EXACT BLOCK */}
                    <div className="flex flex-col gap-1 relative">
                        <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Product Nomenclature</label>
                        
                        {/* Search Input Field */}
                        <input
                            type="text"
                            placeholder="📦 Search Item Models..."
                            value={itemSearchQuery}
                            onChange={(e) => {
                                setItemSearchQuery(e.target.value);
                                setIsItemDropdownVisible(true);
                            }}
                            onFocus={() => {
                                setIsItemDropdownVisible(true);
                                if (selectedItem === 'all') setItemSearchQuery('');
                            }}
                            onBlur={() => {
                                setTimeout(() => {
                                    setIsItemDropdownVisible(false);
                                    const current = uniqueProductsDropdown.find(i => String(i.ItemId) === String(selectedItem));
                                    setItemSearchQuery(current ? current.ItemName : '📦 ALL ITEM MODELS');
                                }, 250);
                            }}
                            className="h-9 px-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-bold outline-none min-w-[200px] text-xs placeholder-gray-400 focus:bg-white focus:border-blue-500 uppercase"
                        />

                        {/* Floating Item Options Overlay Panel */}
                        {isItemDropdownVisible && (
                            <div className="absolute top-14 left-0 w-full min-w-[240px] bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-gray-50 text-xs">
                                <div 
                                    onMouseDown={() => { 
                                        setSelectedItem('all'); 
                                        setItemSearchQuery('📦 ALL ITEM MODELS');
                                    }}
                                    className="p-2.5 hover:bg-blue-50 cursor-pointer font-bold text-blue-600 uppercase"
                                >
                                    📦 ALL ITEM MODELS
                                </div>
                                
                                {filteredItemsOptions.length > 0 ? (
                                    filteredItemsOptions.map(item => (
                                        <div 
                                            key={item.ItemId}
                                            onMouseDown={() => { 
                                                setSelectedItem(item.ItemId); 
                                                setItemSearchQuery(item.ItemName);
                                            }}
                                            className="p-2.5 hover:bg-gray-100 cursor-pointer font-semibold uppercase text-gray-700 transition-colors"
                                        >
                                            {item.ItemName}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-2.5 text-gray-400 font-medium italic text-center">
                                        No matching items found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>




                {isSuperAdmin && (
                    <div className="flex flex-col justify-end pt-4">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all shadow-sm focus:outline-none uppercase tracking-wider"
                    >
                         Add Item
                    </button>
                    </div>
                )}

                </div>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold shadow-sm">
                    <AlertCircle size={14} /> {errorMsg}
                </div>
            )}

            {/* LIGHT DATA GRID BOX */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
                <ItemsTable data={itemsList} loading={isLoading} />
            </div>

            <AddItemClassModal 
                isOpen={isModalOpen}
                userRole={userRole}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchItemsCatalog}
            />
        </div>
    );
};

export default ItemsDirectory;