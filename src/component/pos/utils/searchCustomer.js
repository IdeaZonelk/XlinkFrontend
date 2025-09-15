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

// import axios from 'axios';

// // Handle search input change
// export const handleFindUser = (e, setKeyword) => {
//     setKeyword(e.target.value);
// };

// // Determine search type based on the keyword
// const determineSearchType = (keyword) => {
//     if (/^\d+$/.test(keyword)) { // If the keyword is numeric
//         return 'mobile';
//     } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(keyword)) { // If the keyword looks like an email
//         return 'username';
//     } else {
//         return 'name'; // Default to name if nothing else fits
//     }
// };

// // Handle search form submission
// export const handleSubmit = async (e,setLoading,setSearchedCustomer,keyword) => {
//     e.preventDefault();
//     console.log(keyword)
//     // setLoading(true);
//     // try {
//     //     const searchType = determineSearchType(keyword);
//     //     const response = await axios.get('http://localhost:5000/api/fetchCustomer', {
//     //         params: { keyword, searchType }
//     //     });
//     //     setSearchedCustomer(response.data.length > 0 ? response.data[0] : null);
//     // } catch (error) {
//     //     console.error('Find customer error:', error);
//     // } finally {
//     //     setLoading(false);
//     // }
// };


import axios from 'axios';

// Determine search type based on the keyword
export const determineSearchType = (keyword) => {
    if (/^\d+$/.test(keyword)) {
        return 'mobile';
    } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(keyword)) {
        return 'username';
    } else {
        return 'name';
    }
};

// Real-time search handler (call this on input change)
export const handleFindUser = async (e, setKeyword, setSearchCustomerResults, setCustomerSearchError) => {
    const value = e.target.value;
    setKeyword(value);

    if (value.trim() === "") {
        setSearchCustomerResults([]);
        setCustomerSearchError('');
        return;
    }

    setCustomerSearchError('');
    try {
        const searchType = determineSearchType(value);
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchCustomer`, {
            params: { keyword: value, searchType }
        });
        let customers = response.data.customers || [];
        setSearchCustomerResults(customers);
        if (customers.length === 0) {
            setCustomerSearchError(`Customer not found for "${value}"`);
        }
    } catch (error) {
        setCustomerSearchError('Error searching customer.');
        setSearchCustomerResults([]);
    }
};


