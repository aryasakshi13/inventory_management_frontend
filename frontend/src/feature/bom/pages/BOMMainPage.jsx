import React, { useState } from "react";

import BOMManagementPage from "./BOMManagementPage";
import BOMPreparationPage from "../../bomPreparation/pages/BOMPreparationPage";

const BOMMainPage = () => {
    const [activeTab, setActiveTab] = useState("master");

    return (
        <div className="space-y-4">

            {/* PAGE TABS */}
            <div className="bg-white border border-slate-200 px-4 sm:px-6 pt-3 sm:pt-4 rounded-xl shadow-xs">

                {/* TABS */}
                <div className="flex gap-4 sm:gap-8 overflow-x-auto">

                    {/* BOM MASTER */}
                    <button
                        type="button"
                        onClick={() => setActiveTab("master")}
                        className={`
                            pb-3 text-sm font-medium border-b-2 transition-colors
                            ${
                                activeTab === "master"
                                    ? "text-blue-600 border-blue-600"
                                    : "text-slate-500 border-transparent hover:text-slate-800"
                            }
                        `}
                    >
                        BOM Master
                    </button>

                    {/* BOM PREPARATION */}
                    <button
                        type="button"
                        onClick={() => setActiveTab("preparation")}
                        className={`
                            pb-3 text-sm font-medium border-b-2 transition-colors
                            ${
                                activeTab === "preparation"
                                    ? "text-blue-600 border-blue-600"
                                    : "text-slate-500 border-transparent hover:text-slate-800"
                            }
                        `}
                    >
                        BOM Preparation
                    </button>

                </div>
            </div>

            {/* TAB CONTENT */}
            <div>

                {activeTab === "master" && (
                    <BOMManagementPage />
                )}

                {activeTab === "preparation" && (
                    <BOMPreparationPage />
                )}

            </div>

        </div>
    );
};

export default BOMMainPage;