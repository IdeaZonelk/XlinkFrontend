/*
 * Copyright (c) 2025 Ideazone (Pvt) Ltd
 * Proprietary and Confidential
 *
 * This source code is part of a proprietary Point-of-Sale (POS) system developed by Ideazone (Pvt) Ltd.
 * Use of this code is g                                                {serviceCharge && parseFloat(serviceCharge) > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Service Charge ({serviceChargeType === 'percentage' ? `${serviceCharge}%` : `${currency} ${serviceCharge}`}):</span>
                                                        <span>{currency} {
                                                            serviceChargeType === 'percentage' 
                                                                ? ((parseFloat(price) * parseFloat(serviceCharge)) / 100).toFixed(2)
                                                                : parseFloat(serviceCharge).toFixed(2)
                                                        }</span>
                                                    </div>
                                                )} a license agreement and an NDA.
 * Unauthorized use, modification, distribution, or reverse engineering is strictly prohibited.
 *
 * Contact info@ideazone.lk for more information.
 */

import React, { useState, useContext } from 'react';
import axios from 'axios';
import '../../../styles/role.css';
import { Link, useNavigate } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { toast } from 'react-toastify';

// Import currency context if available, otherwise create a simple one
const CurrencyContext = React.createContext({ currency: 'LKR' });

function CreateServicesBody() {
    // State management
    const [serviceName, setServiceName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('0');
    const [serviceCharge, setServiceCharge] = useState('');
    const [serviceChargeType, setServiceChargeType] = useState('fixed');
    const [discount, setDiscount] = useState('');
    const [discountType, setDiscountType] = useState('fixed');
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [progress, setProgress] = useState(false);
    const navigate = useNavigate();
    
    // Currency context - use if available, otherwise default
    const currency = useContext(CurrencyContext)?.currency || 'LKR';

    // Calculate final price for preview
    const calculateFinalPrice = () => {
        let finalPrice = parseFloat(price) || 0;
        let serviceChargeAmount = 0;
        let discountAmount = 0;

        // Calculate service charge
        if (serviceCharge && parseFloat(serviceCharge) > 0) {
            if (serviceChargeType === 'percentage') {
                serviceChargeAmount = (finalPrice * parseFloat(serviceCharge)) / 100;
            } else {
                serviceChargeAmount = parseFloat(serviceCharge);
            }
        }

        // Calculate discount
        if (discount && parseFloat(discount) > 0) {
            if (discountType === 'percentage') {
                discountAmount = (finalPrice * parseFloat(discount)) / 100;
            } else {
                discountAmount = parseFloat(discount);
            }
        }

        finalPrice = finalPrice + serviceChargeAmount - discountAmount;
        return Math.max(0, finalPrice); // Ensure final price is not negative
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setResponseMessage('');
        setProgress(true);

        // Validate service charge based on type
        if (serviceCharge) {
            if (serviceChargeType === 'percentage' && (parseFloat(serviceCharge) < 0 || parseFloat(serviceCharge) > 100)) {
                toast.error("Service charge percentage must be between 0 and 100%", { autoClose: 2000 });
                setProgress(false);
                return;
            }
            if (serviceChargeType === 'fixed' && parseFloat(serviceCharge) < 0) {
                toast.error("Fixed service charge amount cannot be negative", { autoClose: 2000 });
                setProgress(false);
                return;
            }
        }

        // Validate discount based on type
        if (discount) {
            if (discountType === 'percentage' && (parseFloat(discount) < 0 || parseFloat(discount) > 100)) {
                toast.error("Discount percentage must be between 0 and 100%", { autoClose: 2000 });
                setProgress(false);
                return;
            }
            if (discountType === 'fixed' && parseFloat(discount) < 0) {
                toast.error("Fixed discount amount cannot be negative", { autoClose: 2000 });
                setProgress(false);
                return;
            }
        }

        const serviceData = {
            serviceName,
            description,
            price: price ? parseFloat(price) : null,
            serviceCharge: serviceCharge ? parseFloat(serviceCharge) : 0,
            serviceChargeType,
            discount: discount ? parseFloat(discount) : 0,
            discountType
        };
        
        console.log('Submitting data:', serviceData);

        try {
            const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createService`, serviceData);
            toast.success(
                result.data.message || "Service added successfully!",
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
            navigate('/viewServices');
        } catch (error) {
            console.error('Error creating service:', error);
            let errorMessage = "Service not added. Try again.";
            if (error.response) {
                errorMessage = error.response.data.message || errorMessage;
            }
            toast.error(errorMessage, {
                autoClose: 2000,
                className: "custom-toast"
            });
        } finally {
            setProgress(false);
        }
    };

    const handleClear = () => {
        setServiceName('');
        setDescription('');
        setPrice('');
        setServiceCharge('');
        setServiceChargeType('fixed');
        setDiscount('');
        setDiscountType('fixed');
        setError('');
        setResponseMessage('');
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
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Create Service</h2>
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
                                        <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                            Service Name <span className='text-red-500'>*</span>
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                id="serviceName"
                                                name="serviceName"
                                                type="text"
                                                required
                                                placeholder='Service name'
                                                value={serviceName}
                                                onChange={(e) => setServiceName(e.target.value)}
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
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                        </div>
                                    </div>

                                    {/* Price Breakdown section under description */}
                                    {price && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Price Breakdown</h4>
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Base Price:</span>
                                                    <span>{currency} {parseFloat(price).toFixed(2)}</span>
                                                </div>
                                                {serviceCharge && parseFloat(serviceCharge) > 0 && (
                                                    <div className="flex justify-between text-green-600">
                                                        <span>Service Charge ({serviceChargeType === 'percentage' ? `${serviceCharge}%` : `${currency} ${serviceCharge}`}):</span>
                                                        <span>+{currency} {
                                                            serviceChargeType === 'percentage' 
                                                                ? ((parseFloat(price) * parseFloat(serviceCharge)) / 100).toFixed(2)
                                                                : parseFloat(serviceCharge).toFixed(2)
                                                        }</span>
                                                    </div>
                                                )}
                                                {discount && parseFloat(discount) > 0 && (
                                                    <div className="flex justify-between text-red-600">
                                                        <span>Discount ({discountType === 'percentage' ? `${discount}%` : `${currency} ${discount}`}):</span>
                                                        <span>-{currency} {
                                                            discountType === 'percentage' 
                                                                ? ((parseFloat(price) * parseFloat(discount)) / 100).toFixed(2)
                                                                : parseFloat(discount).toFixed(2)
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
                                                value={discountType}
                                                onChange={(e) => setDiscountType(e.target.value)}
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
                                                    max={discountType === 'percentage' ? "100" : undefined}
                                                    placeholder={discountType === 'percentage' ? '0' : '0.00'}
                                                    value={discount}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                                />
                                                <span className="absolute inset-y-0 right-0 flex items-center px-3 bg-gray-100 text-gray-500 rounded-r-md">
                                                    {discountType === 'percentage' ? '%' : currency}
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
                                                value={serviceChargeType}
                                                onChange={(e) => setServiceChargeType(e.target.value)}
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
                                                    max={serviceChargeType === 'percentage' ? "100" : undefined}
                                                    placeholder={serviceChargeType === 'percentage' ? '0' : '0.00'}
                                                    value={serviceCharge}
                                                    onChange={(e) => setServiceCharge(e.target.value)}
                                                    className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                                />
                                                <span className="absolute inset-y-0 right-0 flex items-center px-3 bg-gray-100 text-gray-500 rounded-r-md">
                                                    {serviceChargeType === 'percentage' ? '%' : currency}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price field (now below tax) */}
                                    <div>
                                        <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Price <span className='text-red-500'>*</span></label>
                                        <div className="mt-2 relative">
                                            <input
                                                id="price"
                                                name="price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                placeholder='0'
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                            />
                                            <span className="absolute inset-y-0 right-0 flex items-center px-3 bg-gray-100 text-gray-500 rounded-r-md">
                                                {currency}
                                            </span>
                                        </div>
                                    </div>

                                </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-start mt-10">
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

                        {/* Error and Response Messages */}
                        <div className='mt-5'>
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
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateServicesBody;