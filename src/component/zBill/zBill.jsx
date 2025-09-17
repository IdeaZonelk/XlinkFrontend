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
import axios from 'axios';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import '../../styles/role.css';
import PaginationDropdown from '../utill/Pagination';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/deleteConfirmationDialog';
import { useCurrency } from '../../context/CurrencyContext';
import formatWithCustomCommas from '../utill/NumberFormate';
import AOS from 'aos';
import 'aos/dist/aos.css';
import ReactToPrint from "react-to-print";
import PrintZbill from './PrintZbill';
import { UserContext } from '../../context/UserContext';
import { X, Clock, CreditCard, Banknote, TrendingDown, Calculator, User, Phone, Mail, Calendar, Timer, TimerOff, HandCoins } from 'lucide-react';
import Fillter from '../../img/filter.png';

const ZBill = () => {
    const { currency } = useCurrency()
    const [saleData, setSaleData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [searchedCustomerSale, setSearchedCustomerSale] = useState(null);
    const [loading, setLoading] = useState(false);
    const popupRef = useRef(null);
    const [openCashDetails, setCashDetails] = useState(null);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [zBillToDelete, setZbillToDelete] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [permissionData, setPermissionData] = useState({});
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyMobile, setCompanyMobile] = useState('');
    const [fillterOptionPopUp, setFiltterOptionPopUp] = useState(false)
    const [logo, setLogo] = useState(null);
    const [date, setDate] = useState('');
    const { userData } = useContext(UserContext);
    const printRefs = useRef({})
    const combinedProductData = searchedCustomerSale ? searchedCustomerSale : saleData;

    // Helper function to safely format dates
    const formatDateSafely = (dateValue, formatType = 'date') => {
        if (!dateValue) return '-';
        
        // If it's already a formatted string from backend (DD/MM/YYYY HH:MM:SS)
        if (typeof dateValue === 'string' && dateValue.includes('/')) {
            const parts = dateValue.split(' ');
            if (parts.length === 2) {
                const [datePart, timePart] = parts;
                if (formatType === 'date') {
                    return datePart; // Returns DD/MM/YYYY
                } else if (formatType === 'time') {
                    return timePart; // Returns HH:MM:SS
                }
            }
            return dateValue; // Return as-is if format is unexpected
        }
        
        // Handle Date objects or ISO strings
        let date;
        if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            return '-';
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '-';
        }
        
        if (formatType === 'date') {
            return date.toLocaleDateString([], {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } else if (formatType === 'time') {
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        }
        
        return '-';
    };

    useEffect(() => {
        if (userData?.permissions) {
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

    const fetchZData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/zreading`, {
                params: {
                    'page[number]': page,
                    'page[size]': size,
                },
            });
            const rawData = response.data.data;

            // Debug logging to see what the backend is sending
            console.log('Raw Z-reading data from backend:', rawData);
            if (rawData.length > 0) {
                console.log('First register data:', rawData[0].registers[0]);
                console.log('First register openedTime:', rawData[0].registers[0]?.openedTime);
                console.log('First register closedTime:', rawData[0].registers[0]?.closedTime);
            }

            const aggregated = rawData.map(z => {
                let totalCash = 0;
                let totalCard = 0;
                let totalBank = 0;
                let totalDiscount = 0;
                let totalProfitAmount = 0;
                let totalVariance = 0;
                let totalCashHandIn = 0;
                let totalGrandTotal = 0;
                
                // Extract times safely, handling pre-formatted strings from backend
                let earliestOpen = null;
                let latestClose = null;
                
                if (z.registers && z.registers.length > 0) {
                    // Parse times from either Date objects or formatted strings
                    const openedTimes = z.registers.map(r => {
                        if (typeof r.openedTime === 'string' && r.openedTime.includes('/')) {
                            // Handle formatted string (DD/MM/YYYY HH:MM:SS)
                            const [datePart, timePart] = r.openedTime.split(' ');
                            const [day, month, year] = datePart.split('/');
                            return new Date(`${year}-${month}-${day}T${timePart}`);
                        }
                        return new Date(r.openedTime);
                    }).filter(date => !isNaN(date.getTime()));
                    
                    const closedTimes = z.registers.map(r => {
                        if (typeof r.closedTime === 'string' && r.closedTime.includes('/')) {
                            // Handle formatted string (DD/MM/YYYY HH:MM:SS)
                            const [datePart, timePart] = r.closedTime.split(' ');
                            const [day, month, year] = datePart.split('/');
                            return new Date(`${year}-${month}-${day}T${timePart}`);
                        }
                        return new Date(r.closedTime);
                    }).filter(date => !isNaN(date.getTime()));
                    
                    if (openedTimes.length > 0) {
                        earliestOpen = new Date(Math.min(...openedTimes));
                    }
                    if (closedTimes.length > 0) {
                        latestClose = new Date(Math.max(...closedTimes));
                    }
                }

                z.registers.forEach(r => {
                    totalCash += r.cashPaymentAmount || 0;
                    totalCard += r.cardPaymentAmount || 0;
                    totalBank += r.bankTransferPaymentAmount || 0;
                    totalDiscount += r.totalDiscountAmount || 0;
                    totalProfitAmount += r.totalProfitAmount || 0;
                    totalVariance += r.cashVariance || 0;
                    totalCashHandIn += r.cashHandIn || 0;
                    totalGrandTotal += (r.cashPaymentAmount || 0) +
                        (r.cardPaymentAmount || 0) +
                        (r.bankTransferPaymentAmount || 0);
                });

                return {
                    _id: z._id,
                    createdAt: z.createdAt,
                    registers: z.registers,
                    totalCash,
                    totalCard,
                    totalBank,
                    totalDiscount,
                    totalProfitAmount,
                    totalVariance,
                    totalCashHandIn,
                    totalGrandTotal,
                    openedTime: earliestOpen ? earliestOpen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-',
                    closedTime: latestClose ? latestClose.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'
                };
            });

            setSaleData(aggregated);
            setSearchedCustomerSale(aggregated);
            setTotalPages(response.data.totalPages || 0);
            setKeyword('');
            setError('');
        } catch (error) {
            console.error('Fetch sale data error:', error);
            setError('No adjustments found.');
            setSaleData([]);
            setSearchedCustomerSale([]);
        } finally {
            setLoading(false);
        }
    };

    const groupRegistersByCashierRegister = (registers) => {
        return registers.reduce((acc, register) => {
            const key = `${register.cashierName} - ${register.cashRegisterID}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(register);
            return acc;
        }, {});
    };

    useEffect(() => {
        if (keyword.trim() === '') {
            fetchZData();
        }
    }, [keyword, page, size, refreshKey]);

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1);
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1);
    }

    const showConfirmationModal = (zBillId) => {
        setZbillToDelete(zBillId);
        setIsModalOpen(true);
    };

    const handleSaleViewPopUp = async (saleId) => {
        setCashDetails(openCashDetails === saleId ? null : saleId);
    };

    useEffect(() => {
        AOS.init({
            duration: 400,
            easing: 'ease-in-out',
            once: true,
        });
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
            setEmail(data.email || '');
            setCompanyName(data.companyName || '');
            setCompanyMobile(data.companyMobile || '');
            setLogo(data.logo || null);
        } catch (error) {
            console.error("[DEBUG] Error fetching settings:", error);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (date) {
            const fetchZDataByDate = async () => {
                setLoading(true);
                try {
                    const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getZreadingByDate`, {
                        params: {
                            'page[size]': size,
                            'page[number]': page,
                            date: date,
                        },
                    });
                    setSaleData(response.data.data);
                    setSearchedCustomerSale(response.data.data);
                    setTotalPages(response.data.totalPages || 0);
                    setKeyword('');
                    setError('');
                } catch (error) {
                    console.error('Fetch sale data error:', error);
                    setError('No adjustments found.');
                    setSaleData([]);
                    setSearchedCustomerSale([]);
                    setLoading(false);
                } finally {
                    setLoading(false);
                }
            };
            fetchZDataByDate();
        }
    }, [date, page, size]);

    const handleDelete = async (_id) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/DeleteZBill/${_id}`);
            setSaleData(saleData.filter(sale => sale._id !== _id));
            toast.success('Z bill deleted successfully!', { autoClose: 2000 }, { className: "custom-toast" });
            setRefreshKey(prevKey => prevKey + 1);
            fetchZData();
        } catch (error) {
            console.error('Error deleting Z bill:', error);
            toast.error('Error deleting Z bill!', { autoClose: 2000 }, { className: "custom-toast" });
            if (error.response) {
                console.error('Error details:', error.response.data);
                setError(error.response.data.message || 'An error occurred on the server');
            } else if (error.request) {
                console.error('No response received:', error.request);
                setError('No response received from server. Please try again later.');
            } else {
                console.error('Request setup error:', error.message);
                setError(error.message || 'An unexpected error occurred.');
            }
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className='relative background-white absolute top-[80px] left-[18%] w-[82%] h-[100vh] p-5'>
            <div className='flex justify-between mb-4'>
                <div className="relative w-full max-w-md">
                    <div>
                        <button onClick={() => setFiltterOptionPopUp(true)} className='flex mt-2 mb-2 justify-end'>
                            <img src={Fillter} alt='Fillter' className='w-10 h-10' />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            ) : error ? (
                <div className=" ">
                    {error && (
                        <p className="">
                        </p>
                    )}
                </div>
            ) : saleData.length > 0 ? (
                <div className="overflow-x-auto scroll-container">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Hand In</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Transfer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Variance</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {saleData.map((zReading, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 text-left whitespace-nowrap">
                                        {zReading.registers && zReading.registers.length === 1
                                            ? formatDateSafely(zReading.registers[0].openedTime, 'date')
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-left whitespace-nowrap">
                                        {zReading.registers && zReading.registers.length === 1
                                            ? formatDateSafely(zReading.registers[0].openedTime, 'time')
                                            : '-'}
                                    </td>

                                    <td className="px-6 py-4 text-left whitespace-nowrap">
                                        {zReading.registers && zReading.registers.length === 1
                                            ? formatDateSafely(zReading.registers[0].closedTime, 'time')
                                            : '-'}
                                    </td>

                                    <td className="px-6 py-4 text-left whitespace-nowrap">
                                        {zReading.registers?.length === 1
                                            ? zReading.registers[0].cashierName
                                            : "Multiple"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className='rounded-[5px] text-center p-[6px] bg-blue-100 text-blue-500'>
                                            {currency} {formatWithCustomCommas(zReading.totalCashHandIn)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>
                                            {currency} {formatWithCustomCommas(zReading.totalCard)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>
                                            {currency} {formatWithCustomCommas(zReading.totalCash)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>
                                            {currency} {formatWithCustomCommas(zReading.totalBank)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className='rounded-[5px] text-center p-[6px] bg-red-100 text-red-500'>
                                            {currency} {formatWithCustomCommas(zReading.totalVariance)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>
                                            {currency} {formatWithCustomCommas(zReading.totalDiscount)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>
                                            {currency} {formatWithCustomCommas(zReading.totalGrandTotal)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className='flex justify-end'>
                                            {permissionData.view_zbills && (
                                                <button
                                                    onClick={() => handleSaleViewPopUp(zReading._id)}
                                                    className="text-[#35AF87] hover:text-[#16796E] font-bold py-1 px-2 mr-2 text-lg"
                                                    style={{ background: 'transparent' }}
                                                >
                                                    <i className="fas fa-eye mr-1"></i>
                                                </button>
                                            )}
                                            {permissionData.delete_zbill && (
                                                <button
                                                    onClick={() => showConfirmationModal(zReading._id)}
                                                    className="text-red-500 hover:text-red-700 font-bold py-1 px-2 flex items-center"
                                                    style={{ background: 'transparent' }}
                                                >
                                                    <i className="fas fa-trash mr-1"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* View Sale popup ref={targetRef}*/}
                                    {openCashDetails === zReading._id && (
                                        <div ref={popupRef} className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-sm">
                                            <div className="overflow-y-auto scroll-container bg-white w-[1300px] max-h-[90vh] overflow-auto rounded-xl shadow-2xl mt-40 mb-10">
                                                {/* Enhanced Header */}
                                                <div className="relative bg-gradient-to-r from-[#35AF87] to-[#2d9670] h-20 p-4 pt-3 items-center flex justify-between shadow-lg">
                                                    <div className='flex items-center space-x-4'>
                                                        <div className="relative">
                                                            <img src={logo} className='w-16 h-16 rounded-full border-2 border-white shadow-md' alt='logo' />
                                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                                                        </div>
                                                        <div>
                                                            <h1 className='text-xl font-bold text-white tracking-wide'>{companyName}</h1>
                                                            <p className='text-sm text-left text-green-100 opacity-90'>Cash Register Report</p>
                                                        </div>
                                                    </div>
                                                    <div className='flex items-center space-x-6 text-right'>
                                                        <div className="flex items-center space-x-2 text-white">
                                                            <Phone className="w-4 h-4" />
                                                            <span className='text-sm font-medium'>{companyMobile}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-white">
                                                            <Mail className="w-4 h-4" />
                                                            <span className='text-sm font-medium'>{email}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setCashDetails(null)}
                                                        className="absolute top-1 right-1 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-200"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {/* Enhanced Content */}
                                                <div className="p-8 bg-gray-50">
                                                    {Object.entries(groupRegistersByCashierRegister(zReading.registers)).map(([key, registers], index) => {
                                                        const [cashierName] = key.split(' - ');
                                                        return (
                                                            <div key={index} className="mb-12 last:mb-0">
                                                                {/* Cashier Header */}
                                                                <div className="flex items-center space-x-3 mb-6 p-4 bg-white rounded-lg shadow-sm border-l-4 border-[#35AF87]">
                                                                    <div className="w-10 h-10 bg-[#35AF87] rounded-full flex items-center justify-center">
                                                                        <User className="w-5 h-5 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <h2 className="text-xl text-left font-bold text-gray-700">
                                                                            Cashier: {cashierName}
                                                                        </h2>
                                                                        <p className="text-sm text-gray-600">Register Operations Summary</p>
                                                                    </div>
                                                                </div>

                                                                {registers.map((register) => (
                                                                    <div key={register._id} className="bg-white rounded-xl p-6 mb-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                                                                        {/* Register Info Grid */}
                                                                        <div className="grid grid-cols-3 gap-8 mb-6">
                                                                            {/* Left Column - Time & Date Info */}
                                                                            <div className="space-y-4">
                                                                                <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                                                                                    <Calendar className="w-5 h-5 text-blue-600" />
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-500 text-left uppercase tracking-wide">Open Date</p>
                                                                                        <p className="font-semibold text-gray-700 text-left"> {zReading.registers && zReading.registers.length === 1
                                                                                            ? formatDateSafely(zReading.registers[0].openedTime, 'date')
                                                                                            : '-'}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                                                                                    <Timer className="w-5 h-5 text-green-600" />
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-500 uppercase tracking-wide text-left">Open Time</p>
                                                                                        <p className="font-semibold text-gray-700 text-left">
                                                                                            {formatDateSafely(register.openedTime, 'time')}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                                                                                    <Calendar className="w-5 h-5 text-blue-600" />
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-500 uppercase tracking-wide text-left">Close Date</p>
                                                                                        <p className="font-semibold text-gray-700 text-left">
                                                                                            {formatDateSafely(register.closedTime, 'date')}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                                                                                    <TimerOff className="w-5 h-5 text-red-600" />
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-500 uppercase tracking-wide text-left">Close Time</p>
                                                                                        <p className="font-semibold text-gray-700 text-left">{formatDateSafely(register.closedTime, 'time')}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                                                                                    <HandCoins className="w-5 h-5 text-blue-600" />
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-500 uppercase tracking-wide text-left">Cash Hand In</p>
                                                                                        <p className="font-semibold text-gray-700 text-left">{currency} {formatWithCustomCommas(register.cashHandIn)}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Middle Column - Payment Methods */}
                                                                            <div className="space-y-4">
                                                                                <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                                                                                    <Banknote className="w-5 h-5 text-emerald-600" />
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-500 uppercase tracking-wide text-left">Cash Payment</p>
                                                                                        <p className="font-semibold text-gray-700 text-left">{currency} {formatWithCustomCommas(register.cashPaymentAmount)}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                                                                                    <CreditCard className="w-5 h-5 text-indigo-600" />
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-500 uppercase tracking-wide text-left">Card Payment</p>
                                                                                        <p className="font-semibold text-gray-700 text-left">{currency} {formatWithCustomCommas(register.cardPaymentAmount)}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                                                                                    <Calculator className="w-5 h-5 text-purple-600" />
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-500 uppercase tracking-wide text-left">Bank Transfer</p>
                                                                                        <p className="font-semibold text-gray-700 text-left">{currency} {formatWithCustomCommas(register.bankTransferPaymentAmount)}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                                                                                    <TrendingDown className="w-5 h-5 text-red-600" />
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-500 uppercase tracking-wide text-left">Discount</p>
                                                                                        <p className="font-semibold text-gray-700 text-left">{currency} {formatWithCustomCommas(register.totalDiscountAmount)}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                                                                                    <Clock className={`w-5 h-5 ${register.cashVariance <= 0 ? 'text-green-600' : 'text-red-400'}`} />
                                                                                    <div>
                                                                                        <p className="text-xs text-gray-400 uppercase tracking-wide text-left">Cash Variance</p>
                                                                                        <p className={`font-semibold text-left ${register.cashVariance <= 0 ? 'text-green-600' : 'text-red-400'}`}>
                                                                                            {currency} {formatWithCustomCommas(register.cashVariance)}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Right Column - Total */}
                                                                            <div className="flex items-start justify-center">
                                                                                <div>
                                                                                    <div className=' bg-[#35AF87] h-[2px] w-full'></div>
                                                                                    <div className="text-center mx-[2px] p-6 bg-[#35AF87] rounded-b-xl shadow-xl text-white">
                                                                                        <p className="text-sm uppercase tracking-wide opacity-90 mb-2">Total when close The POS by {cashierName}</p>
                                                                                        <p className="text-3xl font-bold">
                                                                                            {currency} {formatWithCustomCommas(
                                                                                                register.cashPaymentAmount +
                                                                                                register.cardPaymentAmount +
                                                                                                register.bankTransferPaymentAmount
                                                                                            )}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className='mt-6 px-2 text-left text-gray-600'>
                                                                                        <p><br />Note : The Total value shown Above, Doesn't include the Cash Hand In</p>
                                                                                    </div>

                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Enhanced Denominations Table */}
                                                                        <div className="mt-8">
                                                                            <div className="flex items-center space-x-2 mb-4">
                                                                                <Banknote className="w-5 h-5 text-[#35AF87]" />
                                                                                <h3 className="text-lg font-semibold text-gray-700">Denominations</h3>
                                                                            </div>
                                                                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                                                                        <tr>
                                                                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                                                                Note / Coin
                                                                                            </th>
                                                                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                                                                Quantity
                                                                                            </th>
                                                                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                                                                Amount
                                                                                            </th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                                        {register.inputs.map((input, idx) => (
                                                                                            <tr key={input._id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                                                    <div className="flex items-center space-x-3">
                                                                                                        <div className="w-9 h-9 bg-[#35AF87] rounded-full flex items-center justify-center text-white p-1 text-xs">
                                                                                                            {input.denomination}
                                                                                                        </div>
                                                                                                        <span className="text-sm font-medium text-gray-900">{currency}{' '}{input.denomination}</span>
                                                                                                    </div>
                                                                                                </td>
                                                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                                                                        {input.quantity}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-semibold text-gray-900">
                                                                                                    {currency} {formatWithCustomCommas(input.amount)}
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Enhanced Footer */}
                                                <div className="flex justify-end gap-4 p-6 bg-gray-50 border-t border-gray-200">
                                                    {openCashDetails === zReading._id && (
                                                        <ReactToPrint
                                                            trigger={() => (
                                                                <button className="submit px-6 py-3 mr-2 text-white rounded-md shadow-md transition">
                                                                    <i className="fas fa-print mr-2 text-white"></i>
                                                                    Print Z Bill
                                                                </button>
                                                            )}
                                                            content={() => printRefs.current[zReading._id]}
                                                        />
                                                    )}
                                                    <button
                                                        onClick={() => setCashDetails(null)}
                                                        className="flex items-center space-x-2 px-8 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-all duration-200 hover:shadow-lg"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        <span>Close</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'none' }}>
                                                <PrintZbill
                                                    ref={(el) => (printRefs.current[zReading._id] = el)}
                                                    companyDetails={{
                                                        name: companyName,
                                                        mobile: companyMobile,
                                                        email: email,
                                                        logo: logo
                                                    }}
                                                    zReadingData={zReading}
                                                    registerData={zReading.registerData}
                                                    currency={currency}
                                                    formatCurrency={formatWithCustomCommas}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            ) : (
                <Box sx={{ width: '100%', position: "absolute", top: "0", left: "0", margin: "0", padding: "0" }}>
                    <LinearProgress />
                </Box>
            )
            }

            {fillterOptionPopUp && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex pb-10 justify-center items-center">
                    <div className="bg-white w-[350px] sm:w-[400px] p-6 rounded-xl shadow-2xl transform scale-100 opacity-0 animate-fadeIn" >
                        <button
                            onClick={() => setFiltterOptionPopUp(false)}
                            className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-all"
                        >
                            <img
                                className="w-4 h-4"
                                src="https://th.bing.com/th/id/OIP.Ej48Pm2kmEsDdVNyEWkW0AHaHa?rs=1&pid=ImgDetMain"
                                alt="close"
                            />
                        </button>
                        <h1 className='text-center text-gray-600 font-semi-bold'>Fillters</h1>
                        <div className="mt-5 mb-1">
                            <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date </label>
                            <input
                                id="date"
                                name="date"
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                autoComplete="given-name"
                                className="block w-full rounded-md border- pl-5 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                            />
                        </div>
                        <div className='flex justify-end'>
                            <button
                                onClick={() => {
                                    setFiltterOptionPopUp(false);
                                    fetchZData();
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => handleDelete(zBillToDelete)}
                message="Are you sure you want to delete this adjustment?"
            />

            {/* Pagination Controls - Visible only when data is loaded */}
            <div>
                {!error && combinedProductData.length > 0 && (
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
        </div >
    )
}

export default ZBill