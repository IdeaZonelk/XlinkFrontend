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

import axios from "axios";
import { getTax, getPriceRange, getDiscount } from '../../component/sales/SaleController';
import { toast } from "react-toastify";
import { generateBillNumber } from "../pos/utils/invoiceNumber";

//HANDLE PREVIEW
export const handlePreview = (selectedProduct, grandTotal, paymentStatus, paymentType, orderStatus, discountType, discount, shipping, setSavedProducts,statusOfQuatation) => {
    if (!selectedProduct || selectedProduct.length === 0) {
        console.error('No selected products to preview.');
        return;
    }
    const productsToSave = selectedProduct.map(product => {
        const price = getPriceRange(product, product.selectedVariation);
        const quantity = product.barcodeQty || 1;
        const taxRate = product.oderTax ? product.oderTax / 100 : getTax(product, product.selectedVariation) / 100;
        const subtotal = (price * quantity) + (price * quantity * taxRate);

        return {
            name: product.name,
            quantity,
            price,
            subtotal,
            selectedVariation: product.selectedVariation,
            tax: taxRate * 100,
            discount,
            shipping,
            grandTotal: Number(grandTotal) || 0,
            pStatus: paymentStatus,
            pType: paymentType,
            productStatus: orderStatus
        };
    });
    setSavedProducts(productsToSave);
};


//HANDLE SAVE PRODUCT
export const handleSaveQuatation = async (
    grandTotal, orderStatus, paymentStatus, paymentType, shipping, discountType, discount, discountValue, tax, warehouse, selectedCustomer, selectedProduct, date, setResponseMessage, setError, setProgress, statusOfQuatation, navigate, getApplicablePrice
) => {
    setProgress(true);
    setResponseMessage('');
    setError('');

    const numberRegex = /^[0-9]*(\.[0-9]+)?$/;
    if (!numberRegex.test(tax)) {
        setError('Tax must be a valid number');
        setProgress(false);
        return;
    }
    if (!numberRegex.test(discount)) {
        setError('Discount must be a valid number');
        setProgress(false);
        return;
    }
    if (!numberRegex.test(shipping)) {
        setError('Shipping must be a valid number');
        setProgress(false);
        return;
    }
    if (!date) {
        setError('Date is required');
        setProgress(false);
        return;
    }
    if (!paymentStatus) {
        setError('Payment Status is required');
        setProgress(false);
        return;
    }
    if (!warehouse) {
        setError('Warehouse is required');
        setProgress(false);
        return;
    }
    if (!selectedCustomer || !selectedCustomer.name) {
        setError('Customer information is required');
        setProgress(false);
        return;
    }
    if (!orderStatus) {
        setError('Order Status is required');
        setProgress(false);
        return;
    }
    if (!paymentType) {
        setError('Payment is required');
        setProgress(false);
        return;
    }

    const defaultWarehouse = sessionStorage.getItem('defaultWarehouse') || 'Unknown';

    // Calculate subtotal using the same logic as calculateTotal
    const subtotal = selectedProduct.reduce((acc, product) => {
        const quantity = product.barcodeQty || 1;
        const discountVal = getDiscount(product, product.selectedVariation) || 0;
        const productPrice = getApplicablePrice(product) || 0;

        // Handle variation taxType
        const taxType =
            product.ptype === 'Variation'
                ? product.variationValues?.[product.selectedVariation]?.taxType
                : product.taxType;

        let productSubtotal;
        if (taxType === 'Inclusive') {
            productSubtotal = (productPrice - discountVal) * quantity;
        } else {
            const taxRate = product.orderTax ? product.orderTax / 100 : getTax(product, product.selectedVariation) / 100;
            const taxPerProduct = productPrice * taxRate;
            productSubtotal = ((productPrice - discountVal) * quantity) + (taxPerProduct * quantity);
        }
        return acc + productSubtotal;
    }, 0);

    // Calculate discount value
    let discountValueCalc = 0;
    if (discountType === 'fixed') {
        discountValueCalc = Number(discount || 0);
    } else if (discountType === 'percentage') {
        discountValueCalc = (subtotal * Number(discount || 0)) / 100;
    }

    const shippingValue = parseFloat(shipping) || 0;
    const overallTaxRate = tax ? parseFloat(tax) / 100 : 0;
    const taxAmount = subtotal * overallTaxRate;
    const totalAmount = (subtotal - discountValueCalc) + taxAmount + shippingValue;
    const paidAmount = paymentStatus.toLowerCase() === 'paid' ? totalAmount : 0;

    const commonSaleData = {
        date,
        customer: selectedCustomer.name,
        warehouse: warehouse || null,
        tax,
        discountType,
        discount,
        discountValue: discountValueCalc,
        shipping,
        paymentStatus,
        paymentType,
        orderStatus,
        paidAmount,
        grandTotal: totalAmount,
        statusOfQuatation
    };

    // Create products data array
    const productsData = selectedProduct.map(product => {
        const currentID = product._id;
        const ptype = product.ptype;
        const variationValue = product.selectedVariation;
        const quantity = product.barcodeQty || 1;
        const variationObj = product.ptype === 'Variation'
            ? product.variationValues?.[variationValue] || {}
            : product;

        const wholesaleEnabled = variationObj.wholesaleEnabled || false;
        const wholesaleMinQty = variationObj.wholesaleMinQty || 0;
        const wholesalePrice = variationObj.wholesalePrice || 0;

        const applicablePrice = getApplicablePrice(product);
        const price = getPriceRange(product, product.selectedVariation);
        const discountVal = getDiscount(product, product.selectedVariation) || 0;
        const productCost = variationObj.productCost || product.productCost || 0;

        // Handle variation taxType
        const taxType =
            product.ptype === 'Variation'
                ? product.variationValues?.[variationValue]?.taxType
                : product.taxType;

        let taxRate = product.orderTax ? product.orderTax / 100 : getTax(product, product.selectedVariation) / 100;
        let subtotal;
        if (taxType === 'Inclusive') {
            subtotal = (applicablePrice - discountVal) * quantity;
        } else {
            const taxPerProduct = applicablePrice * taxRate;
            subtotal = ((applicablePrice - discountVal) * quantity) + (taxPerProduct * quantity);
        }
        const warehouseId = product.selectedWarehouseId || product.warehouseId || defaultWarehouse;

        return {
            currentID,
            ptype,
            variationValue,
            name: product.name,
            price,
            productCost,
            discount: discountVal,
            quantity,
            taxRate,
            subtotal,
            warehouse: warehouseId,
            wholesaleEnabled,
            wholesaleMinQty,
            wholesalePrice,
        };
    });

    // Combine common sale data with products data
    const finalQuatationData = {
        ...commonSaleData,
        productsData,
    };

    console.log('Final Quatation Data:', finalQuatationData);
    try {
        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/createQuatation`, finalQuatationData);
        console.log('Response:', response.data);
        toast.success(
            'Quotation created successfully!',
            { autoClose: 2000 },
            { className: "custom-toast" }
        );
        navigate('/viewQuotation');
    } catch (error) {
        console.error('Error creating Quatation:', error);

        if (error.response) {
            toast.error(
                'Server error' || 'Unknown error',
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
        } else if (error.request) {
            toast.error(
                'No response from server. Please check your network connection.',
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
        } else {
            toast.error(
                `Unexpected error: ${error.message}`,
                { autoClose: 2000 },
                { className: "custom-toast" }
            );
        }
    } finally {
        setProgress(false);
    }
};
export const handleUpdateQuatation = async (
    id, grandTotal, orderStatus, paymentStatus, paidAmount, paymentType, shipping,
    discountType, discount, discountValue, tax, warehouse, selectedCustomer,
    productData, date, setError, setResponseMessage, setProgress, navigate
) => {
    setProgress(true);
    setError('');
    setResponseMessage('');

    if (!Array.isArray(productData)) {
        setError('Invalid Quatation data format. Expected an array.');
        return;
    }

    const totalAmount = Number(grandTotal) || 0;
    const PaidAmount = paymentStatus.toLowerCase() === 'paid' ? grandTotal : 0;
    const defaultWarehouse = sessionStorage.getItem('defaultWarehouse') || 'Unknown';

    const commonSaleData = {
        date,
        selectedCustomer,
        warehouse: warehouse || null,
        tax,
        discountType,
        discount,
        discountValue,
        shipping,
        paymentStatus,
        paymentType,
        orderStatus,
        paidAmount:PaidAmount,
        grandTotal: totalAmount,
    };

    console.log('Common Sale Data: 💚💚💚💚💚💚💚💚😎🤖😎🤖🤖🤖', productData);

    // Create products data array
    const productsData = productData.map(product => {
        const currentID = product.currentID;
        const variationValue = product.variationValue;
        const price = product.price;
        const productCost = product.productCost;
        const discount = product.discount;
        const ptype =product.ptype;
        const quantity = product.quantity || 1;
        const taxRate = product.taxRate
        const subtotal = product.subtotal;
        const warehouseId = product.warehouse;
        const wholesaleEnabled = product.wholesaleEnabled || false;
        const wholesaleMinQty = product.wholesaleMinQty || 0;
        const wholesalePrice = product.wholesalePrice || 0;

        return {
            currentID,
            variationValue,
            name: product.name,
            ptype,
            price,
            productCost,
            discount,
            quantity,
            taxRate,
            subtotal,
            warehouse: warehouseId,
            wholesaleEnabled,
            wholesaleMinQty,
            wholesalePrice,
        };
    });

    const updatedQuatationData = {
        ...commonSaleData,
        productsData,
    };
    console.log(updatedQuatationData)
    try {
        const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateQuatation/${id}`, updatedQuatationData);
        console.log('Response:', response.data);
        toast.success(
            'Quotation updated successfully!',
                     { autoClose: 2000 },
                     { className: "custom-toast" }
                   );
            navigate ('/viewQuotation');
    } catch (error) {
        console.error('Error updating Quatation:', error);

        if (error.response) {
            toast.error(
                `Server error' || 'Unknown error'}`,
                         { autoClose: 2000 },
                         { className: "custom-toast" }
                       );
        } else if (error.request) {
            toast.error(
                'No response from the server. Please check your network connection.',
                         { autoClose: 2000 },
                         { className: "custom-toast" }
                       );
        } else {
            toast.error(
                `Unexpected error: ${error.message}`,
                         { autoClose: 2000 },
                         { className: "custom-toast" }
                       );
        }
    } finally {
        setProgress(false);
    }
};

//HANDLE SAVE PRODUCT
export const handleCreateSale = async (id, grandTotal, baseTotal, orderStatus,paymentStatus,paymentType,amounts,shipping,discountType,discount, discountValue, tax,warehouse,selectedCustomer,quatationProductData,date,preFix,setInvoiceNumber,setError,setResponseMessage,setProgress, navigate, profit, useCreditPayment, creditDetails) => {
    setProgress(true);
    setError('');
    setResponseMessage('')

    const invoiceNumber = generateBillNumber();
        setInvoiceNumber(invoiceNumber);
    
    let refferenceId = '';
    if (preFix) {
        refferenceId = `${preFix}_${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
        refferenceId = `SL_${Math.floor(1000 + Math.random() * 9000)}`;
    }
    if (!refferenceId || typeof refferenceId !== 'string' || refferenceId.trim() === '') {
        throw new Error('Invalid reference ID. It must be a non-empty string.');
    }

    // Validate if `tax`, `discount`, and `shipping` contain only numbers
    const numberRegex = /^[0-9]*(\.[0-9]+)?$/; // Regex for numeric values (integer or float)
    if (!numberRegex.test(tax)) {
        setError('Tax must be a valid number');
        setProgress(false);
        return;
    }
    if (!numberRegex.test(discount)) {
        setError('Discount must be a valid number');
        setProgress(false);
        return;
    }
    if (!numberRegex.test(shipping)) {
        setError('Shipping must be a valid number');
        setProgress(false);
        return;
    }
    if (!selectedCustomer) {
        setError('Customer information is required');
        setProgress(false);
        return;
    }
    if (!date) {
        setError('Date is required');
        setProgress(false);
        return;
    }
    if (!paymentStatus) {
        setError('Payment Status is required');
        setProgress(false);
        return;
    }
    if (!warehouse) {
        setError('Warehouse is required');
        setProgress(false);
        return;
    }

    const totalAmount = Number(grandTotal) || 0;
    console.log(totalAmount);
    const paidAmount = Object.values(amounts).reduce((sum, value) => sum + (Number(value) || 0), 0);
    console.log(paidAmount);
    const defaultWarehouse = sessionStorage.getItem('defaultWarehouse') || 'Unknown';

    const paymentTypesArray = Object.keys(paymentType)
    .filter((type) => paymentType[type] && Number(amounts[type]) > 0)
    .map((type) => ({ type, amount: Number(amounts[type]) }));
    console.log("Received Payment Types Array in handleSave:", paymentTypesArray);

    const balance = totalAmount - paidAmount; // Get the balance amount
    console.log(balance);

    const normalizedPaymentStatus = paymentStatus?.toLowerCase();
    console.log(paymentStatus);

    // If payment status is "paid" and balance is greater than 0, prevent submission
    if (normalizedPaymentStatus === 'paid' && balance > 0) {
        alert("Payment status is 'Paid', but there's still a balance remaining. Please adjust the payment amount.");
        setProgress(false);
        return;
    }

    const commonSaleData = {
        id,
        refferenceId,
        date,
        customer: selectedCustomer,
        warehouse: warehouse || null,
        tax,
        discountType,
        discount,
        discountValue,
        shipping,
        paymentStatus,
        paymentType: paymentTypesArray,
        orderStatus,
        paidAmount,
        grandTotal: totalAmount,
        pureProfit: profit || 0,
        baseTotal,
        saleType:'Non-POS',
        invoiceNumber,
        useCreditPayment,
        creditDetails
    };

    // Create products data array
    const productsData = (Array.isArray(quatationProductData) ? quatationProductData : []).map(product => {
        const currentID = product.currentID;
        const ptype = product.ptype;
        const variationValue = product.variationValue;
        const price = product.price;
        const quantity = product.quantity;
        const discount = product.discount;
        const taxRate = product.taxRate;
        const warehouseId = product.warehouse || defaultWarehouse;
        const wholesaleEnabled = product.wholesaleEnabled || false;
        const wholesaleMinQty = product.wholesaleMinQty || 0;
        const wholesalePrice = product.wholesalePrice || 0;

        const appliedWholesale = wholesaleEnabled && quantity >= wholesaleMinQty;
        const applicablePrice = appliedWholesale ? wholesalePrice : price;

        const subtotal = (applicablePrice - discount) * quantity + ((applicablePrice) * quantity * taxRate);

        return {
            currentID,
            ptype,
            variationValue,
            name: product.name,
            appliedWholesale,
            applicablePrice,
            price,
            quantity,
            discount,
            taxRate,
            subtotal,
            warehouse: warehouseId,
            wholesaleEnabled,
            wholesaleMinQty,
            wholesalePrice,
        };
    });

    // Combine common sale data with products data
    const finalSaleData = {
        ...commonSaleData,
        productsData,
    };
    console.log(finalSaleData)
    try {
        const endpoint = '/api/createNonPosSale';
        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}${endpoint}`, finalSaleData);
        console.log('Response:', response.data.message);
        toast.success(
            'Sale created successfully!',
                     { autoClose: 2000 },
                     { className: "custom-toast" }
                   );

         // Update the statusOfQuatation in the corresponding Quatation
         try {
            await axios.put(`${process.env.REACT_APP_BASE_URL}/api/updateQuatation/${id}`, {
                statusOfQuatation: true
            });
            console.log('Quotation status updated successfully!');
        } catch (updateError) {
            console.error('Error updating quotation status:', updateError);
            setError('Sale created, but failed to update quotation status.');
        }

            navigate('/viewQuotation'); 
    } catch (error) {
        console.error('Error creating sale:', error);
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
        setProgress(false);
    } finally {
        setProgress(false);
    }
};
