/*
 * Copyright (c) 2025 Ideazone (Pvt) Ltd
 * Proprietary and Confidential
 *
 * This source code is part of a proprietary Point-of-Sale (POS) system developed by Ideazone (Pvt) Ltd.
 * Use of this code is governed by a license agreement and an NDA.
 * Unauthorized use, modification, distribution, or reverse engineering is strictly prohibited.
 *
 * Contact info@ideazone.lk for more information.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/role.css';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function ReceiptSettingsBody() {
    const [isOn, setIsOn] = useState({
        note: false,
        phone: false,
        customer: false,
        address: false,
        email: false,
        taxDiscountShipping: false,
        barcode: false,
        productCode: false,
        logo: false,
        template: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleToggle = (key) => {
        setIsOn(prevState => ({
            ...prevState,
            [key]: !prevState[key],
        }));
    };

    const handleTemplateChange = (size) => {
        setIsOn(prevState => ({
            ...prevState,
            template: size
        }));
    };

    useEffect(() => {
        fetchReceiptSettings();
    }, []);

    const fetchReceiptSettings = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getReceiptSettings`);
            setIsOn({
                note: data.note || false,
                phone: data.phone || false,
                customer: data.customer || false,
                address: data.address || false,
                email: data.email || false,
                taxDiscountShipping: data.taxDiscountShipping || false,
                barcode: data.barcode || false,
                productCode: data.productCode || false,
                logo: data.logo || false,
                template: data.template || ''
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
            setError('Error fetching settings');
        }
    };

    const handleReceiptSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!isOn.template) {
            toast.error('Please select a template size', { autoClose: 2000, className: "custom-toast" });
            setLoading(false);
            return;
        }
        const formData = {
            note: isOn.note,
            phone: isOn.phone,
            customer: isOn.customer,
            address: isOn.address,
            email: isOn.email,
            taxDiscountShipping: isOn.taxDiscountShipping,
            barcode: isOn.barcode,
            productCode: isOn.productCode,
            logo: isOn.logo,
            template: isOn.template
        };

        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createOrUpdateReceiptSettings`, formData);
            toast.success(response.data.message, { autoClose: 2000, className: "custom-toast" });

            setTimeout(() => {
                window.location.href = '/receiptSettings';
            }, 1000);
        } catch (error) {
            console.error('Error saving data:', error);
            if (error.response) {
                if (error.response.data && error.response.data.message) {
                    toast.error(error.response.data.message, { autoClose: 2000, className: "custom-toast" });
                    setError(error.response.data.message);
                } else {
                    toast.error(`Server responded with status: ${error.response.status}`, { autoClose: 2000, className: "custom-toast" });
                    setError(`Server responded with status: ${error.response.status}`);
                }
            } else if (error.request) {
                toast.error('No response from the server. Please check your internet connection.', { autoClose: 2000, className: "custom-toast" });
                setError('No response from the server. Please check your internet connection.');
            } else {
                toast.error('An unexpected error occurred while setting up the request.', { autoClose: 2000, className: "custom-toast" });
                setError('An unexpected error occurred while setting up the request.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="background-white relative left-[18%] w-[82%] min-h-[100vh] p-5">
                {/* Receipt Settings Section */}
                <div className="flex justify-between items-center mb-2 w-full">
                    <h2 className="text-lightgray-300 p-0 mt-[74px] text-2xl">Receipt Settings</h2>
                    <Link
                        className='px-4 py-1.5 border mt-[74px] border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white'
                        to={'/dashboard'}
                    >
                        Back
                    </Link>
                </div>
                <div className="bg-white mt-5 pb-2 w-full rounded-2xl px-10 shadow-md">
                    <div className="flex flex-col px-2 mt-4 py-12 lg:px-4">
                        <form onSubmit={handleReceiptSubmit}>
                            {/* Toggle Buttons */}
                            <div>
                                <div className="flex flex-wrap w-full gap-10">
                                    {[
                                        { key: 'note', label: 'Show Note' },
                                        { key: 'phone', label: 'Show Phone' },
                                        { key: 'customer', label: 'Show Customer' },
                                        { key: 'address', label: 'Show Address' },
                                        { key: 'email', label: 'Show Email' },
                                        { key: 'taxDiscountShipping', label: 'Show Tax Discount & Shipping' },
                                        { key: 'barcode', label: 'Show Barcode in Receipt' },
                                        { key: 'logo', label: 'Show Logo' },
                                        { key: 'productCode', label: 'Show Product Code' },
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex-1 flex items-center space-x-2 max-w-[30%] min-w-[30%]">
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(key)}
                                                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${isOn[key] ? 'button-bg-color' : 'bg-gray-400'}`}
                                            >
                                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${isOn[key] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </button>
                                            <label className="text-sm font-medium leading-6 text-gray-900">
                                                {label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bill Template Upload Section */}
                            <div className="bg-white mt-10 pb-4 w-full rounded-2xl">
                                <div className="flex flex-col gap-2 px-1 py-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <span className="text-base text-gray-700">
                                            Select Template Size:
                                        </span>
                                        <div className="flex flex-wrap gap-6">
                                            {["80mm", "A4", "A5"].map(size => (
                                                <label key={size} className="flex items-center space-x-1">
                                                    <input
                                                        type="radio"
                                                        name="templateSize"
                                                        value={size}
                                                        checked={isOn.template === size}
                                                        onChange={() => handleTemplateChange(size)}
                                                        className={`form-radio ${isOn.template === size ? 'text-blue-500' : 'text-gray-400'}`}
                                                    />
                                                    <span>{size}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="container mx-auto text-left">
                                <div className="flex justify-start">
                                    <button
                                        className="submit text-white rounded-md mt-8 px-4 py-2 bg-blue-500 hover:bg-blue-700 transition"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {'Save Settings'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Error and Response Messages */}
                        <div className="mt-5">
                            {error && (
                                <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReceiptSettingsBody;
