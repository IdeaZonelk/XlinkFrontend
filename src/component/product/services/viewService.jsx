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

import { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import PaginationDropdown from '../../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../common/deleteConfirmationDialog';
import { UserContext } from '../../../context/UserContext';

function ViewServicesBody() {
    console.log('🚀 ViewServicesBody component mounted');
    
    // State variables
    const [serviceData, setServiceData] = useState([]);
    const [serviceName, setServiceName] = useState('');
    const [searchedServices, setSearchedServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);  
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const debounceTimeout = useRef(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [permissionData, setPermissionData] = useState({});
    const { userData } = useContext(UserContext);

    useEffect(() => {
        if (userData?.permissions) {
          console.log("UserData received in useEffect:", userData);
      
          setPermissionData(extractPermissions(userData.permissions));
        }
    }, [userData]);

    const extractPermissions = (permissions) => {
        let extractedPermissions = {};
      
        Object.keys(permissions).forEach((category) => {
          Object.keys(permissions[category]).forEach((subPermission) => {
            extractedPermissions[subPermission] = permissions[category][subPermission];
          });
        });
      
        return extractedPermissions;
    };

    // Format price display
    const formatPrice = (price, type = 'fixed', value = 0) => {
        if (!price && price !== 0) return '-';
        return `LKR ${parseFloat(price).toFixed(2)}`;
    };

    // Format service charge/discount display
    const formatServiceChargeDiscount = (value, type) => {
        if (!value && value !== 0) return '-';
        if (type === 'percentage') {
            return `${value}%`;
        } else {
            return `LKR ${parseFloat(value).toFixed(2)}`;
        }
    };

    // Fetch all service data
    const fetchServiceData = async () => {
        console.log('🔄 fetchServiceData called');
        setLoading(true);
        try {
            const url = `${process.env.REACT_APP_BASE_URL}/api/findAllService`;
            console.log('📡 Making request to:', url);
            
            const response = await axios.get(url, {
                params: {
                    'page[size]': size,
                    'page[number]': page,
                },
            });
            
            console.log('✅ Response received:', response.data);
            
            if (response.data && response.data.services && Array.isArray(response.data.services)) {
                setServiceData(response.data.services);
                setSearchedServices(response.data.services);
                setTotalPages(response.data.totalPages || 0);
                setServiceName('');
                console.log('✅ Services set:', response.data.services.length, 'items');
            } else {
                console.error('❌ Unexpected response format:', response.data);
                setServiceData([]);
                setSearchedServices([]);
            }
        } catch (error) {
            console.error('❌ Fetch service data error:', error);
            console.error('❌ Error details:', error.response?.data || error.message);
            setServiceData([]);
            setSearchedServices([]);
            setError('No services found.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (serviceName.trim() === '') {
            fetchServiceData();
        }
    }, [serviceName, page, size, refreshKey]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    const showConfirmationModal = (_id, isSearchResult = false) => {
        setServiceToDelete({ _id, isSearchResult });
        setIsModalOpen(true);
    };

    const handleDelete = async (_id, isSearchResult = false) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/deleteService/${_id}`);
            
            if (isSearchResult) {
                setSearchedServices(searchedServices.filter(service => service._id !== _id));
            }
            setServiceData(serviceData.filter(service => service._id !== _id));
            
            toast.success('Service deleted successfully!', { autoClose: 2000 });
            setRefreshKey(prevKey => prevKey + 1);

            if (isSearchResult) {
                fetchServiceData();
            }

        } catch (error) {
            console.error('Delete service error:', error);
            toast.error('Error deleting service!', { autoClose: 2000 });
        } finally {
            setIsModalOpen(false);
        }
    };

    const searchService = async (query) => {
        setLoading(true);
        setError('');
        try {
            if (!query.trim()) {
                setSearchedServices(serviceData);
                setResponseMessage('');
                return;
            }
    
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchService`, {
                params: { serviceName: query },
            });
            if (response.data.services && response.data.services.length > 0) {
                setSearchedServices(response.data.services);
                setResponseMessage('');
            } else {
                setSearchedServices([]);
                setError('No services found for the given query.');
            }
        } catch (error) {
            console.error('Find service error:', error);
            setSearchedServices([]);
            setError('No services found for the given name.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setServiceName(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            if (value.trim() === '') {
                setError('');
                setResponseMessage('');
                setSearchedServices(serviceData);
            } else {
                searchService(value);
            }
        }, 100); 
    };

    const handleKeyDown = (e) => {
        const value = e.target.value;

        if (e.key === "Backspace" && value === '') {
            setSearchedServices([]);
        }
    };

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                    <form
                        className="flex items-center"
                        onSubmit={(e) => {
                            e.preventDefault();
                            searchService(serviceName);
                        }}
                    >
                        <input
                           onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            name='keyword'
                            type="text"
                            placeholder="Search by service..."
                            className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                            value={serviceName}
                        />
                        <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <svg
                                className="h-5 w-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M9 3a6 6 0 100 12A6 6 0 009 3zm0-1a7 7 0 110 14A7 7 0 019 2z"
                                    clipRule="evenodd"
                                />
                                <path
                                    fillRule="evenodd"
                                    d="M12.9 12.9a1 1 0 011.41 0l3 3a1 1 0 01-1.41 1.41l-3-3a1 1 0 010-1.41z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </form>
                </div>
                <div className="flex items-center">
                    <div>
                        <Link
                            to={'/createService'}
                            className="submit flex-none rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-60 text-center"
                        >
                            Create Service
                        </Link>
                    </div>
                </div>
            </div>

            {loading ? (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>) : error ? (
                    <div className=" ">
                                {error && (
                                    <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">
                                        {error}
                                    </p>
                                )}
                            </div>
            ) : searchedServices.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Charge</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-bold">Final Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {searchedServices.map((service) => (
                                <tr key={service._id}>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{service.serviceName}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{service.description || '-'}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{formatPrice(service.price)}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        {(service.serviceCharge || service.orderTax) > 0 ? formatServiceChargeDiscount(service.serviceCharge || service.orderTax, service.serviceChargeType || service.taxType) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        {service.discount > 0 ? formatServiceChargeDiscount(service.discount, service.discountType) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900 font-semibold text-green-600">
                                        {formatPrice(service.finalPrice)}
                                    </td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900 text-right">
                                        <div className='flex items-center justify-end'>
                                            <Link to={`/editService/${service._id}`}
                                                className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                            </Link>
                                            <button
                                                onClick={() => showConfirmationModal(service._id, true)}
                                                className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                style={{ background: 'transparent' }}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Charge</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-bold">Final Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {(serviceName.trim() ? searchedServices : serviceData).map((service) => (
                                <tr key={service._id}>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{service.serviceName}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{service.description || '-'}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">{formatPrice(service.price)}</td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        {(service.serviceCharge || service.orderTax) > 0 ? formatServiceChargeDiscount(service.serviceCharge || service.orderTax, service.serviceChargeType || service.taxType) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900">
                                        {service.discount > 0 ? formatServiceChargeDiscount(service.discount, service.discountType) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900 font-semibold text-green-600">
                                        {formatPrice(service.finalPrice)}
                                    </td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap text-m text-gray-900 text-right">
                                        <div className='flex text-left items-center justify-end'>
                                        <Link to={`/editService/${service._id}`}
                                            className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2"
                                            style={{ background: 'transparent' }}
                                        >
                                            <i className="fas fa-edit mr-1"></i>
                                        </Link>
                                        <button
                                            onClick={() => showConfirmationModal(service._id)}
                                            className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                            style={{ background: 'transparent' }}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => handleDelete(serviceToDelete._id, serviceToDelete.isSearchResult)}
                message="Are you sure you want to delete this service?"
            />

            <div>
            {serviceData.length > 0 && (
                <PaginationDropdown
                    size={size}
                    setSize={setSize}
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                    handlePrevPage={handlePrevPage}
                    handleNextPage={handleNextPage}
                />
            )}
        </div>

            <div className="absolute bottom-28 right-0 left-0">
                    {responseMessage && (
                        <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center inline-block">
                            {responseMessage}
                        </p>
                    )}
                </div>
        </div>
    );
}

export default ViewServicesBody;