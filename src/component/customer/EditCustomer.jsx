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
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../../styles/dashboardBody.css';
import avatarIcon from '../../img/profile.png';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { isValidMobileInput, isAllowedKey } from '../utill/MobileValidation';
import { toast } from 'react-toastify';

function EditCustomerBody() {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        name: '',
        nic: '',
        mobile: '',
        loyaltyReferenceNumber: '',
        redeemedPoints: ''
    });
    const [errors, setErrors] = useState({});
    const [progress, setProgress] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Fetch customer data for editing
    useEffect(() => {
        const fetchCustomerData = async () => {
            try {
                
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getCustomerForUpdate/${id}`);
                const fetchedData = response.data;
                setFormData({
                    name: fetchedData.name || '',
                    nic: fetchedData.nic || '',
                    mobile: fetchedData.mobile || '',
                    loyaltyReferenceNumber: fetchedData.loyaltyReferenceNumber || '',
                    redeemedPoints: fetchedData.redeemedPoints ?? ''
                });
                setLoading(false);
            } catch (error) {
                toast.error('Failed to fetch customer data.', { autoClose: 2000 });
                setErrors(prevErrors => ({ ...prevErrors, general: 'Failed to fetch customer data.' }));
                setLoading(false);
            }
        };
        fetchCustomerData();
    }, [id]);

    // Handle keydown event to restrict invalid keys
    const handleKeyDown = (e) => {
        const key = e.key;
        if (!isAllowedKey(key)) {
            e.preventDefault();
        }
    };

    // Handle input field values
    const handleChange = (e) => {
        setErrors({});
        setResponseMessage('');
        const { name, value } = e.target;
        let updatedFormData = { ...formData, [name]: value };

        // Mobile number validation
        if (name === 'mobile') {
            if (!isValidMobileInput(value) || value.length !== 10) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    mobile: 'Invalid mobile number. Must be 10 characters long.'
                }));
            } else {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    mobile: ''
                }));
            }
        }

        // NIC validation
        const newNICRegex = /^\d{12}$/;
        const oldNICRegex = /^\d{9}[VXvx]$/;
        if (name === 'nic' && value) {
            if (!newNICRegex.test(value) && !oldNICRegex.test(value)) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    nic: 'NIC must be either 12 digits (new format) or 9 digits followed by "V" or "X" (old format).'
                }));
            } else {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    nic: ''
                }));
            }
        }

        // Loyalty reference validation
        if (name === 'loyaltyReferenceNumber' && value) {
            if (!/^[a-zA-Z0-9]+$/.test(value)) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    loyaltyReferenceNumber: 'Loyalty reference must be alphanumeric.'
                }));
            } else {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    loyaltyReferenceNumber: ''
                }));
            }
        }

        // Redeemed points validation
        if (name === 'redeemedPoints' && value) {
            if (value && isNaN(Number(value))) {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    redeemedPoints: 'Redeemed Points must be a number.'
                }));
            } else {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    redeemedPoints: ''
                }));
            }
        }

        setFormData(updatedFormData);
    };

    // Handle submit
    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});
        setResponseMessage('');
        setProgress(true);

        // Required fields check
        if (!formData.name || !formData.nic || !formData.mobile || !formData.loyaltyReferenceNumber) {
            setErrors(prev => ({ ...prev, general: 'All fields except Redeemed Points are required.' }));
            setProgress(false);
            return;
        }

        if (errors.mobile || errors.nic || errors.loyaltyReferenceNumber || errors.redeemedPoints) {
            setProgress(false);
            return;
        }

        const formDataToSubmit = {
            id,
            name: formData.name.trim(),
            nic: formData.nic.trim(),
            mobile: formData.mobile.trim(),
            loyaltyReferenceNumber: formData.loyaltyReferenceNumber.trim(),
            redeemedPoints: formData.redeemedPoints ? Number(formData.redeemedPoints) : 0
        };

        axios.put(`${process.env.REACT_APP_BASE_URL}/api/editCustomerProfileByAdmin`, formDataToSubmit)
            .then(response => {
                setResponseMessage("Successfully updated the customer");
                toast.success("Successfully updated the customer", { autoClose: 2000, className: "custom-toast" });
                setTimeout(() => {
                    navigate('/viewCustomers');
                }, 1000);
                setProgress(false);
            })
            .catch((error) => {
                const errorMessage =
                    error.response?.data?.message || 'An error occurred while updating the customer. Please try again.';
                toast.error(errorMessage, { autoClose: 2000, className: "custom-toast" });
                setProgress(false);
            });
    };

    // Clear all fields
    const handleClear = () => {
        setFormData({
            name: '',
            nic: '',
            mobile: '',
            loyaltyReferenceNumber: '',
            redeemedPoints: ''
        });
        setErrors({});
        setResponseMessage('');
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className='background-white absolute top-[80px] left-[18%] w-[82%] h-[900px] p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200 }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Edit Customer</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewCustomers'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full h-[800px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <div className="flex items-center justify-center">
                        <img className='w-[120px] h-[120px] rounded mb-10' src={avatarIcon} alt="icon" />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-16">
                            <div className="flex-1">
                                {/* Name field */}
                                <div className="mt-2">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Name <span className='text-red-500'>*</span></label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        placeholder='Ben'
                                        value={formData.name}
                                        onChange={handleChange}
                                        autoComplete="given-name"
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                </div>

                                {/* NIC field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">NIC <span className='text-red-500'>*</span></label>
                                    <input
                                        id="nic"
                                        name="nic"
                                        type="text"
                                        required
                                        placeholder='NIC'
                                        value={formData.nic}
                                        onChange={handleChange}
                                        maxLength={12}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                    {errors.nic && <p className="text-red-600 text-sm mt-1">{errors.nic}</p>}
                                </div>

                                {/* Redeemed Points */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Redeemed Points</label>
                                    <input
                                        id="redeemedPoints"
                                        name="redeemedPoints"
                                        type="number"
                                        placeholder='0'
                                        value={formData.redeemedPoints}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                    {errors.redeemedPoints && <p className="text-red-600 text-sm mt-1">{errors.redeemedPoints}</p>}
                                </div>
                            </div>
                            <div className="flex-1">
                                {/* Mobile number field */}
                                <div className="mt-2">
                                    <label htmlFor="mobile" className="block text-sm font-medium leading-6 text-gray-900 text-left">
                                        Mobile number <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        id="mobile"
                                        name="mobile"
                                        type="text"
                                        required
                                        placeholder='xxx xxxx xxx'
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        maxLength={10}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                    {errors.mobile && <p className="text-red-600 text-sm mt-1">{errors.mobile}</p>}
                                </div>
                                
                                {/* Loyalty Reference Number */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Loyalty Reference Number <span className='text-red-500'>*</span></label>
                                    <input
                                        id="loyaltyReferenceNumber"
                                        name="loyaltyReferenceNumber"
                                        type="text"
                                        required
                                        placeholder='Loyalty Ref'
                                        value={formData.loyaltyReferenceNumber}
                                        onChange={handleChange}
                                        className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                    />
                                    {errors.loyaltyReferenceNumber && <p className="text-red-600 text-sm mt-1">{errors.loyaltyReferenceNumber}</p>}
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
                </div>
            </div>
        </div>
    );
}

export default EditCustomerBody;