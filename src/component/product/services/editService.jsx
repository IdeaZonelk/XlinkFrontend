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

import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { toast } from 'react-toastify';

// Import currency context if available, otherwise create a simple one
const CurrencyContext = React.createContext({ currency: 'LKR' });

function EditServicesBody() {
    const { id } = useParams();
    const [serviceData, setServiceData] = useState({
        serviceName: '',
        description: '',
        price: '',
        serviceCharge: '',
        serviceChargeType: 'fixed',
        discount: '',
        discountType: 'fixed'
    });
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [progress, setProgress] = useState(true);
    const navigate = useNavigate();
    
    // Currency context - use if available, otherwise default
    const currency = useContext(CurrencyContext)?.currency || 'LKR';

    // Calculate final price for preview
    const calculateFinalPrice = () => {
        let finalPrice = parseFloat(serviceData.price) || 0;
        let serviceChargeAmount = 0;
        let discountAmount = 0;

        // Calculate service charge
        if (serviceData.serviceCharge && parseFloat(serviceData.serviceCharge) > 0) {
            if (serviceData.serviceChargeType === 'percentage') {
                serviceChargeAmount = (finalPrice * parseFloat(serviceData.serviceCharge)) / 100;
            } else {
                serviceChargeAmount = parseFloat(serviceData.serviceCharge);
            }
        }

        // Calculate discount
        if (serviceData.discount && parseFloat(serviceData.discount) > 0) {
            if (serviceData.discountType === 'percentage') {
                discountAmount = (finalPrice * parseFloat(serviceData.discount)) / 100;
            } else {
                discountAmount = parseFloat(serviceData.discount);
            }
        }

        finalPrice = finalPrice + serviceChargeAmount - discountAmount;
        return Math.max(0, finalPrice); // Ensure final price is not negative
    };

    useEffect(() => {
        const fetchServiceData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getServiceForUpdate/${id}`);
                console.log('Fetched service data:', response.data);

                if (response.data.status === 'Success') {
                    setServiceData({
                        serviceName: response.data.service.serviceName,
                        description: response.data.service.description || '',
                        price: response.data.service.price || '',
                        serviceCharge: response.data.service.serviceCharge || response.data.service.orderTax || '',
                        serviceChargeType: response.data.service.serviceChargeType || response.data.service.taxType || 'fixed',
                        discount: response.data.service.discount || '',
                        discountType: response.data.service.discountType || 'fixed'
                    });
                } else {
                    setResponseMessage(response.data.message || 'Failed to fetch data');
                }
            } catch (error) {
                console.error('Fetch service data error:', error);
                setError('Data not fetched');
            } finally {
                setProgress(false);
            }
        };

        fetchServiceData();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setServiceData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResponseMessage('');
        setProgress(true);
        
        // Validate service charge based on type
        if (serviceData.serviceCharge) {
            if (serviceData.serviceChargeType === 'percentage' && (parseFloat(serviceData.serviceCharge) < 0 || parseFloat(serviceData.serviceCharge) > 100)) {
                toast.error("Service charge percentage must be between 0 and 100%", { autoClose: 2000 });
                setProgress(false);
                return;
            }
            if (serviceData.serviceChargeType === 'fixed' && parseFloat(serviceData.serviceCharge) < 0) {
                toast.error("Fixed service charge amount cannot be negative", { autoClose: 2000 });
                setProgress(false);
                return;
            }
        }

        // Validate discount based on type
        if (serviceData.discount) {
            if (serviceData.discountType === 'percentage' && (parseFloat(serviceData.discount) < 0 || parseFloat(serviceData.discount) > 100)) {
                toast.error("Discount percentage must be between 0 and 100%", { autoClose: 2000 });
                setProgress(false);
                return;
            }
            if (serviceData.discountType === 'fixed' && parseFloat(serviceData.discount) < 0) {
                toast.error("Fixed discount amount cannot be negative", { autoClose: 2000 });
                setProgress(false);
                return;
            }
        }
        
        const serviceDataForUpdate = {
            id,
            serviceName: serviceData.serviceName,
            description: serviceData.description,
            price: serviceData.price ? parseFloat(serviceData.price) : null,
            serviceCharge: serviceData.serviceCharge ? parseFloat(serviceData.serviceCharge) : 0,
            serviceChargeType: serviceData.serviceChargeType,
            discount: serviceData.discount ? parseFloat(serviceData.discount) : 0,
            discountType: serviceData.discountType
        };
        
        console.log("for update ", serviceDataForUpdate);
        
        try {
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateService/${id}`, serviceDataForUpdate);

            if (response.data.status === 'success') {
                toast.success(
                    "Service updated successfully!",
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
                navigate('/viewServices');
                setError('');
            } else {
                setResponseMessage('');
                toast.error(
                    "Failed to update service",
                    { autoClose: 2000 },
                    { className: "custom-toast" }
                );
            }
        } catch (error) {
            console.error('Update service error:', error);
            let errorMessage = "Failed to update service";
            if (error.response) {
                errorMessage = error.response.data.message || errorMessage;
            }
            toast.error(errorMessage, {
                autoClose: 2000,
                className: "custom-toast"
            });
            setResponseMessage('');
        } finally {
            setProgress(false);
        }
    };

    const handleClear = () => {
        setError('');
        setResponseMessage('');
        setServiceData({
            serviceName: '',
            description: '',
            price: '',
            serviceCharge: '',
            serviceChargeType: 'fixed',
            discount: '',
            discountType: 'fixed'
        });
    };

    return (
        <div className='background-white absolute top-[80px] left-[18%] w-[82%] h-[800px] p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Edit Service</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewServices'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-[900px] h-[700px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-5">
                                {/* Service name field */}
                                <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Service Name</label>
                                    <div className="mt-2">
                                        <input
                                            id="serviceName"
                                            name="serviceName"
                                            type="text"
                                            required
                                            placeholder='Service name'
                                            value={serviceData.serviceName}
                                            onChange={handleInputChange}
                                            autoComplete="given-name"
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>

                                {/* Description field */}
                                <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Description</label>
                                    <div className="mt-2">
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows="3"
                                            placeholder='Service description'
                                            value={serviceData.description}
                                            onChange={handleInputChange}
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>

                                {/* Price Breakdown under description */}
                                {serviceData.price && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Price Breakdown</h4>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span>Base Price:</span>
                                                <span>{currency} {parseFloat(serviceData.price).toFixed(2)}</span>
                                            </div>
                                            {serviceData.serviceCharge && parseFloat(serviceData.serviceCharge) > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Service Charge ({serviceData.serviceChargeType === 'percentage' ? `${serviceData.serviceCharge}%` : `${currency} ${serviceData.serviceCharge}`}):</span>
                                                    <span>+{currency} {
                                                        serviceData.serviceChargeType === 'percentage' 
                                                            ? ((parseFloat(serviceData.price) * parseFloat(serviceData.serviceCharge)) / 100).toFixed(2)
                                                            : parseFloat(serviceData.serviceCharge).toFixed(2)
                                                    }</span>
                                                </div>
                                            )}
                                            {serviceData.discount && parseFloat(serviceData.discount) > 0 && (
                                                <div className="flex justify-between text-red-600">
                                                    <span>Discount ({serviceData.discountType === 'percentage' ? `${serviceData.discount}%` : `${currency} ${serviceData.discount}`}):</span>
                                                    <span>-{currency} {
                                                        serviceData.discountType === 'percentage' 
                                                            ? ((parseFloat(serviceData.price) * parseFloat(serviceData.discount)) / 100).toFixed(2)
                                                            : parseFloat(serviceData.discount).toFixed(2)
                                                    }</span>
                                                </div>
                                            )}
                                            <hr className="my-2" />
                                            <div className="flex justify-between font-semibold">
                                                <span>Final Price:</span>
                                                <span>{currency} {calculateFinalPrice().toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        
                            </div>

                            {/* Right Column */}
                            <div className="space-y-5">
                                {/* Discount field */}
                                <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Discount</label>
                                    <div className="mt-2 flex gap-2">
                                        <select
                                            id="discountType"
                                            name="discountType"
                                            value={serviceData.discountType}
                                            onChange={handleInputChange}
                                            className="block w-1/3 rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        >
                                            <option value="fixed">Fixed</option>
                                            <option value="percentage">Percentage</option>
                                        </select>
                                        <div className="relative flex-1">
                                            <input
                                                id="discount"
                                                name="discount"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max={serviceData.discountType === 'percentage' ? "100" : undefined}
                                                placeholder={serviceData.discountType === 'percentage' ? '0' : '0.00'}
                                                value={serviceData.discount}
                                                onChange={handleInputChange}
                                                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                            <span className="absolute inset-y-0 right-0 flex items-center px-3 bg-gray-100 text-gray-500 rounded-r-md">
                                                {serviceData.discountType === 'percentage' ? '%' : currency}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Service Charge field (now above price) */}
                                <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Service Charge</label>
                                    <div className="mt-2 flex gap-2">
                                        <select
                                            id="serviceChargeType"
                                            name="serviceChargeType"
                                            value={serviceData.serviceChargeType}
                                            onChange={handleInputChange}
                                            className="block w-1/3 rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        >
                                            <option value="fixed">Fixed</option>
                                            <option value="percentage">Percentage</option>
                                        </select>
                                        <div className="relative flex-1">
                                            <input
                                                id="serviceCharge"
                                                name="serviceCharge"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max={serviceData.serviceChargeType === 'percentage' ? "100" : undefined}
                                                placeholder={serviceData.serviceChargeType === 'percentage' ? '0' : '0.00'}
                                                value={serviceData.serviceCharge}
                                                onChange={handleInputChange}
                                                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                            <span className="absolute inset-y-0 right-0 flex items-center px-3 bg-gray-100 text-gray-500 rounded-r-md">
                                                {serviceData.serviceChargeType === 'percentage' ? '%' : currency}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Price field (now below service charge) */}
                                <div>
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Price<span className='text-red-500'>*</span></label>
                                    <div className="mt-2 relative">
                                        <input
                                            id="price"
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            placeholder='0.00'
                                            value={serviceData.price}
                                            onChange={handleInputChange}
                                            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                        <span className="absolute inset-y-0 right-0 flex items-center px-3 bg-gray-100 text-gray-500 rounded-r-md">
                                            {currency}
                                        </span>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="container mx-auto text-left">
                            <div className='mt-10 flex justify-start'>
                                <button type='submit' className="button-bg-color button-bg-color:hover flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex ml-2 justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 w-[100px] focus:ring-gray-500 focus:ring-offset-2"
                                    onClick={handleClear}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </form>
                    {/* Error and Response Messages */}
                    <div className='mt-10'>
                        {error && (
                            <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                                {error}
                            </p>
                        )}
                        {responseMessage && (
                            <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center mx-auto max-w-sm inline-block">
                                {responseMessage}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditServicesBody;