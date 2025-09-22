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

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { toast } from 'react-toastify';

function EditServicesBody() {
    const { id } = useParams();
    const [serviceData, setServiceData] = useState({
        serviceName: '',
        price: '',
        duration: ''
    });
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [progress, setProgress] = useState(true);
    const navigate = useNavigate();

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
        
        const serviceDataForUpdate = {
            id,
            serviceName: serviceData.serviceName,
            description: serviceData.description,
            price: serviceData.price ? parseFloat(serviceData.price) : null,
           
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
            <div className="bg-white mt-[20px] w-[630px] h-[600px] rounded-2xl px-8 shadow-md">
                <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-16">
                            <div className="flex-1">
                                {/* Service name field */}
                                <div className="mt-5">
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
                                            className="block w-[500px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>

                                {/* Description field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Description</label>
                                    <div className="mt-2">
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows="3"
                                            placeholder='Service description'
                                            value={serviceData.description}
                                            onChange={handleInputChange}
                                            className="block w-[500px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>

                                {/* Price field */}
                                <div className="mt-5">
                                    <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Price</label>
                                    <div className="mt-2">
                                        <input
                                            id="price"
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder='0.00'
                                            value={serviceData.price}
                                            onChange={handleInputChange}
                                            className="block w-[500px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>

                              

                                <div className="container mx-auto text-left">
                                    <div className='mt-10 flex justify-start'>
                                        <button type='submit' className="button-bg-color  button-bg-color:hover flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 w-[100px] text-center focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
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
                            <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">
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