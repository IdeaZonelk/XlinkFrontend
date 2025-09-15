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
import { handleReturnPurchase } from '../PurchaseController'
import '../../../styles/role.css';
import { Link } from 'react-router-dom';
import { useParams, useNavigate } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { useCurrency } from '../../../context/CurrencyContext';
import formatWithCustomCommas from '../../utill/NumberFormate';

function CreatePurchaseReturnBody() {
    // State managemen
    const { currency } = useCurrency()
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [error, setError] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [saleProduct, setSaleProduct] = useState([])
    const [progress, setProgress] = useState(false);
    const [note, setNote] = useState('');
    const [reason, setReason] = useState('');
    const [saleReturProductData, setPurchaseReturProductData] = useState([])
    const { id } = useParams();
    const navigate = useNavigate();
    const [returnDetails, setReturnDetails] = useState({
    returnAmount: 0,
    returnTax: 0,
    returnDiscount: 0
});

    useEffect(() => {
        if (saleReturProductData.length > 0) {
            // Update selectedProduct based on the tax information in purchasedQty
            setSelectedProduct(prevSelectedProduct =>
                prevSelectedProduct.map((product, index) => {
                    const purchasedProduct = saleReturProductData[index]; 
                    if (purchasedProduct) {
                        return {
                            ...product,
                            taxRate: purchasedProduct.taxRate || 0 
                        };
                    }
                    return product; 
                })
            );
        }
    }, [saleReturProductData])

    useEffect(() => {
        const findSaleById = async () => {
            setProgress(true)
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findPurchaseById/${id}`);
                const baseProductData = response.data.productsDetails || [];
                const fetchedProductsQty = response.data.productsData || [];

                const initializedProducts = baseProductData.map(product => ({
                    ...product,
                    selectedVariation: product.selectedVariation || Object.keys(product.variationValues)[0]
                }));
                const initializedProductsQty = fetchedProductsQty.map(pq => ({
                    ...pq,
                    quantity: pq.quantity || Object.keys(pq.quantity)[0],
                    returnQty: pq.quantity 
                }));
                setPurchaseReturProductData(initializedProductsQty);
                setSelectedProduct(initializedProducts);
                setSaleProduct(response.data);
                setProgress(false)
            } catch (error) {
                console.error('Error fetching sale by ID:', error.response ? error.response.data : error.message);
            }
        };

        if (id) {
            findSaleById();
        }
    }, [id]);

    const handleReturnQtyChange = (index, value) => {
    setPurchaseReturProductData(prev =>
        prev.map((product, i) => {
            if (i === index) {
                let newQty = Number(value);
                // Prevent increasing above purchased qty or going below 0
                if (newQty > product.quantity) newQty = product.quantity;
                if (newQty < 0) newQty = 0;
                // Update subtotal for this product
                const subtotal = (newQty * product.price).toFixed(2);
                return { ...product, returnQty: newQty, subtotal };
            }
            return product;
        })
    );
};

const calculateTotal = () => {
    return saleReturProductData.reduce((sum, product) => {
        return sum + (Number(product.returnQty) * Number(product.price));
    }, 0).toFixed(2);
};

// const calculateReturnAmount = () => {
//     const productsTotal = saleReturProductData.reduce((sum, product) => {
//         return sum + (Number(product.returnQty) * Number(product.price));
//     }, 0);
    
//     if (productsTotal <= 0) return 0;
    
//     // Get original purchase values
//     const originalProductsTotal = saleProduct.productsData.reduce((sum, product) => {
//         return sum + (Number(product.quantity) * Number(product.price));
//     }, 0);
    
//     // Calculate proportional factor
//     const proportion = productsTotal / originalProductsTotal;
    
//     // Apply the same proportion to tax, discount, and shipping
//     // const returnShipping = proportion * (Number(saleProduct.shipping) || 0);
    
//     // Calculate tax proportionally (if tax is percentage-based)
//     let returnTax = 0;
//     if (saleProduct.tax) {
//         // If tax is a percentage value
//         returnTax = productsTotal * (Number(saleProduct.tax) / 100);
//     }
    
//     const returnDiscount = proportion * (Number(saleProduct.discount) || 0);
    
//     // Calculate final return amount
//     let returnAmount = productsTotal + returnTax;
    
//     // Apply discount based on original discount type
//     if (saleProduct.discountType === 'fixed') {
//         returnAmount -= returnDiscount;
//     } else if (saleProduct.discountType === 'percentage') {
//         returnAmount -= (productsTotal * (returnDiscount / 100));
//     }
    
//     return returnAmount.toFixed(2);
// };

useEffect(() => {
    const calculatedReturn = calculateReturnAmount();
    setReturnDetails(calculatedReturn);
}, [saleReturProductData, saleProduct]);

const calculateReturnAmount = () => {
    const productsTotal = saleReturProductData.reduce((sum, product) => {
        return sum + (Number(product.returnQty) * Number(product.price));
    }, 0);
    
    if (productsTotal <= 0) return { returnAmount: 0, returnTax: 0, returnDiscount: 0 };
    console.log('Products Total:', productsTotal);
    
    // Get original purchase values
    const originalProductsTotal = saleProduct.productsData.reduce((sum, product) => {
        return sum + (Number(product.quantity) * Number(product.price));
    }, 0);
    console.log('Original Products Total:', originalProductsTotal);
    // Calculate proportional factor
    const proportion = productsTotal / originalProductsTotal;
    console.log('Proportion:', proportion);

    // Calculate tax proportionally (if tax is percentage-based)
    let returnTax = 0;
    if (saleProduct.tax) {
        // If tax is a percentage value
        returnTax = productsTotal * (Number(saleProduct.tax) / 100);
    }
    console.log('Return Tax:', returnTax);
    // Apply discount based on original discount type
    let returnDiscount = 0;
    if (saleProduct.discountType === 'fixed') {
        returnDiscount = proportion * (Number(saleProduct.discount) || 0);
    } else if (saleProduct.discountType === 'percentage') {
        returnDiscount = productsTotal * (Number(saleProduct.discount) / 100);
    }
    console.log('Return Discount:', returnDiscount);
    // Calculate final return amount
    let returnAmount = productsTotal + returnTax - returnDiscount;
    console.log('Return Amount before formatting:', returnAmount);
    return {
        returnAmount: returnAmount.toFixed(2),
        returnTax: returnTax.toFixed(2),
        returnDiscount: returnDiscount.toFixed(2)
    };
};
    const handleReasonChange = (e) => {
        const selectedReason = e.target.value;
        setReason(selectedReason);
        if (selectedReason !== 'Other') {
            setNote(selectedReason);
        } else {
            setNote('');
        }
    };

    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh] p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 ml-4 m-0 p-0 text-2xl">Create Sale</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#37b34a] text-[#37b34a] rounded-md transition-colors duration-300 hover:bg-[#37b34a] hover:text-white' to={'/viewCustomers'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[100px] w-full rounded-2xl px-8 shadow-md pb-14">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5">
                            {/* warehouse*/}
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select warehouse <span className='text-red-500'>*</span></label>
                                <select
                                    id="warehouse"
                                    name="warehouse"
                                    value={saleProduct.warehouse}
                                    disabled
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">{saleProduct.warehouse}</option>
                                </select>
                                {error.username && <p className="text-red-500">{error.username}</p>}
                            </div>

                            {/* customer */}
                            <div className="flex-1 ">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Suplier <span className='text-red-500'>*</span></label>
                                <input
                                    id="customer"
                                    name="customer"
                                    value={saleProduct.supplier}
                                    required
                                    disabled
                                    className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                />
                            </div>

                            {/*Date*/}
                            <div className="flex-1 ">
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date <span className='text-red-500'>*</span></label>
                                <input
                                    id="text"
                                    name="text"
                                    type="text"
                                    required
                                    disabled
                                    value={new Date(saleProduct.date).toLocaleDateString()}
                                    autoComplete="given-name"
                                    className="block w-full rounded-md border- pl-5 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="mt-10 min-w-full bg-white border rounded-md border-gray-200">
                            <thead className="rounded-md bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">tax</th> */}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                                </tr>
                            </thead>
                            {saleReturProductData.length > 0 && (
                                <tbody>
                                    {saleReturProductData.map((product, index) => (
                                        <tr key={index}>
                                           <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
    {product.name}
    {product.ptype === 'Variation' && product.variationValue && (
        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {product.variationValue}
        </span>
    )}
</td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm">
                                                <p className='rounded-[5px] text-center p-[6px] bg-green-100 text-green-500'>{product.stockQty}</p>
                                            </td>

                                            <td className="px-6 py-4  text-left whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <span className="mx-2">
                                                        {saleReturProductData[index]?.quantity || 0} {/* Display the current quantity */}
                                                    </span>
                                                </div>
                                            </td>
                                                  {/* Return Qty Field */}
            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                <input
                    type="number"
                    min={0}
                    max={product.quantity}
                    value={product.returnQty}
                    onChange={e => handleReturnQtyChange(index, e.target.value)}
                    className="w-16 border rounded px-2 py-1 text-center"
                />
            </td>

                                            {/* Product Price */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {formatWithCustomCommas(product.price)}
                                            </td>

                                            {/* Product Tax */}
                                            {/* <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.taxRate * 100} % 
                                            </td> */}

                                            {/* Subtotal */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency} {formatWithCustomCommas(product.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            )}
                        </table>
                    </div>

                    <div className="">
                        <div className="grid grid-cols-1 gap-4 mt-10">
                            <div className="relative">
                                <label className="block text-left text-sm font-medium text-gray-700">
                                    Reason: <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={reason}
                                    onChange={handleReasonChange}
                                    className="block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-gray-400 placeholder:text-gray-400 focus:ring-gray-400 focus:outline-none sm:text-sm"
                                >
                                    <option value="">Select a reason</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            {reason === 'Other' && (
                                <div className="relative mt-4 ">
                                    <label className="block text-left text-sm font-medium text-gray-700">
                                        Reason: <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={note}
                                        type="text"
                                        placeholder="Add a reason for the return"
                                        className="block w-full rounded-md border-0 py-2.5 px-2 pr-10 max-h-28 text-gray-900 shadow-sm ring-1 ring-gray-400 placeholder:text-gray-400 focus:ring-gray-400 focus:outline-none sm:text-sm"
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="mt-8 text-right text-lg font-semibold">
                            Paid Amount  :  {currency} {formatWithCustomCommas(saleProduct.paidAmount)}
                        </div>
                        <div className="mt-4 text-right text-lg font-semibold">
                            Products Total  :  {currency} {formatWithCustomCommas(calculateTotal())}
                        </div>
                        <div className="mt-4 text-right text-lg font-semibold">
        Return Amount  :  {currency} {formatWithCustomCommas(returnDetails.returnAmount)}
        <div className="text-sm text-gray-500 font-normal mt-1">
            (without shipping)
        </div>
    </div>
                    </div>

                <button onClick={() => {
    const calculatedReturn = calculateReturnAmount();
    setReturnDetails(calculatedReturn);
    handleReturnPurchase(
        calculatedReturn.returnAmount, 
        calculatedReturn.returnTax,
        calculatedReturn.returnDiscount,
        calculateTotal(), 
        saleProduct.paidAmount, 
        note,
        saleProduct.warehouse, 
        saleProduct.supplier, 
        saleReturProductData, 
        saleProduct.date, 
        saleProduct._id, 
        setError, 
        setResponseMessage, 
        setProgress, 
        navigate
    );
}} className="mt-5 submit  w-[200px] text-white rounded py-2 px-4">
    Return The Sale
</button>
                </div>
                {/* Error and Response Messages */}
                <div className="mt-5">
                    <div className="relative">
                        {/* Reserve space for messages */}
                        <div className="absolute top-0 left-0 w-full">
                            {error && (
                                <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 text-center mx-auto max-w-sm">
                                    {error}
                                </p>
                            )}
                            {responseMessage && (
                                <p className="text-color px-5 py-2 rounded-md bg-green-100 text-center mx-auto max-w-sm">
                                    {responseMessage}
                                </p>
                            )}
                        </div>
                        {/* Reserve empty space to maintain layout */}
                        <div className="h-[50px]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default CreatePurchaseReturnBody;
