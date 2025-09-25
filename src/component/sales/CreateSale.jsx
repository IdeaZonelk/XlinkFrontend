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

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  handleProductSelect,
  handleProductSearch,
  handleCustomerSearch,
  handleCustomerSelect,
  handleWarehouseChange,
  handleVariationChange,
  getProductCost,
  getDiscount,
  getQty,
  getPriceRange,
  handleDelete,
  handleQtyChange,
  getTax,
  handleSave,
} from "./SaleController";
import "../../styles/role.css";
import { Link } from "react-router-dom";
import { fetchProductDataByWarehouse } from "../pos/utils/fetchByWarehose";
import Decrease from "../../img/down-arrow (1).png";
import { decryptData } from "../utill/encryptionUtils";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import formatWithCustomCommas from "../utill/NumberFormate";
import { useCurrency } from "../../context/CurrencyContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ServicesPopupModal from "../pos/components/ServicesPopupModal";

function CreateSaleBody() {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [warehouseData, setWarehouseData] = useState([]);
  const [warehouse, setWarehouse] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filteredCustomer, setFilteredCustomer] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [date, setDate] = useState("");
  const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
  const [selectedBrandProducts, setSelectedBrandProducts] = useState([]);
  const [productBillingHandling, setSearchedProductData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(false);
  const [discountType, setDiscountType] = useState("");
  const [discountSymbole, setDiscountSymbole] = useState(currency);
  const [discount, setDiscount] = useState("");
  const [shipping, setShipping] = useState("");
  const [tax, setTax] = useState("");
  const [error, setError] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [note, setNote] = useState("null");
  const [invoiceData, setInvoiceData] = useState([]);
  const [balance, setBalance] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [shouldPrint, setShouldPrint] = useState(false);
  const [paymentType, setPaymentType] = useState({
    cash: false,
    card: false,
    bank_transfer: false,
  });

  const [amounts, setAmounts] = useState({
    cash: "",
    card: "",
    bank_transfer: "",
  });
  const numberRegex = /^[0-9]*(\.[0-9]+)?$/;
  const [decryptedUser, setDecryptedUser] = useState(null);
  const [preFix, setPreFix] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(null);
  const [useCreditPayment, setUseCreditPayment] = useState(false);
  const [creditDetails, setCreditDetails] = useState({
    interestRate: "",
    months: "",
    interestAmount: "",
    monthlyInstallment: "",
  });
  const dropdownRef = useRef(null); // Ref for the dropdown container
  const [claimedPoints, setClaimedPoints] = useState("");
  const [isPointsClaimed, setIsPointsClaimed] = useState(false);
  const [redeemedPointsFromSale, setRedeemedPointsFromSale] = useState(0);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  
  // Services-related state
  const [services, setServices] = useState([]);
  const [isServicesPopupOpen, setIsServicesPopupOpen] = useState(false);

  useEffect(() => {
    const points = calculateRedeemedPoints();
    setRedeemedPointsFromSale(points);
  }, [selectedProduct, discount, tax, shipping, discountType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        e.target.id !== "text" // Ensure the input field doesn't close the dropdown
      ) {
        setFilteredProducts([]); // Close dropdown
      }
    };
     document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchAllWarehouses = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`
        );
        setWarehouseData(response.data.warehouses || []);
      } catch (error) {
        console.error("Failed to fetch all warehouses:", error);
      }
    };
    fetchAllWarehouses();
  }, []);

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setDate(formattedDate);
  }, []);


const calculateBaseTotal = () => {
    return selectedProduct.reduce((total, product) => {
        const productPrice = Number(getApplicablePrice(product));
        const productQty = product.barcodeQty || 1;
        const taxRate = product.orderTax ? product.orderTax / 100 : getTax(product, product.selectedVariation) / 100;
        const discount = Number(getDiscount(product, product.selectedVariation));
        const discountedPrice = productPrice - discount;

        // Get correct taxType for variations or single products
        const taxType = product.ptype === "Variation"
            ? product.variationValues?.[product.selectedVariation]?.taxType
            : product.taxType;

        let subTotal;
        if (taxType === "Inclusive") {
            subTotal = discountedPrice * productQty;
        } else {
            subTotal = (discountedPrice * productQty) + (productPrice * productQty * taxRate);
        }
        return total + subTotal;
    }, 0);
};

   const totalWithoutInterest = () => {
    const productTotal = selectedProduct.reduce((total, product) => {
        const productPrice = Number(getApplicablePrice(product));
        const productQty = product.barcodeQty || 1;
        const taxRate = product.orderTax ? product.orderTax / 100 : getTax(product, product.selectedVariation) / 100;
        const discount = Number(getDiscount(product, product.selectedVariation));
        const discountedPrice = productPrice - discount;

        const taxType = product.ptype === "Variation"
            ? product.variationValues?.[product.selectedVariation]?.taxType
            : product.taxType;

        let subTotal;
        if (taxType === "Inclusive") {
            subTotal = discountedPrice * productQty;
        } else {
            subTotal = (discountedPrice * productQty) + (productPrice * productQty * taxRate);
        }
        return total + subTotal;
    }, 0);

    let discountValue = 0;
    if (discountType === 'fixed') {
        discountValue = Number(discount);
    } else if (discountType === 'percentage') {
        discountValue = (productTotal * Number(discount)) / 100;
    }

    // Shipping cost remains the same
    const shippingValue = Number(shipping);

    // Calculate global tax for the total bill
    const globalTaxRate = Number(tax) / 100; // Convert to decimal
    const globalTax = productTotal * globalTaxRate; // Tax on total product amount

    // Grand total = productTotal - discount + shipping + globalTax
    const grandTotal = productTotal - discountValue + shippingValue + globalTax;
    
    return grandTotal;
};
const calculateTotal = () => {
    const total = totalWithoutInterest();
    
    // Apply credit interest if credit payment is used
    let totalWithInterest = total;
    if (useCreditPayment) {
        const interestRate = parseFloat(creditDetails.interestRate) || 0;
        const interest = (total * interestRate) / 100;
        totalWithInterest = total + interest;
    }
    
    // Subtract claimed points if they are claimed
    let finalTotal = totalWithInterest;
    if (isPointsClaimed && claimedPoints) {
        const pointsValue = parseFloat(claimedPoints) || 0;
        finalTotal = Math.max(0, totalWithInterest - pointsValue); // Ensure total doesn't go negative
    }
    
    return finalTotal;
};

    const calculateTaxLessTotal = () => {
        let subtotal = selectedProduct.reduce((total, product) => {
            const productPrice = Number(getApplicablePrice(product));
            console.log("product price", productPrice);
            const productQty = product.barcodeQty || 1;
            console.log("product qty", productQty);
            const discount = Number(getDiscount(product, product.selectedVariation));
            console.log("product discount", discount);
            const discountedPrice = productPrice - discount
            console.log("discounted price", discountedPrice);
            const subTotal = (discountedPrice * productQty);
            console.log("sub total", subTotal);
            return total + subTotal;

        }, 0);
        const total = subtotal;
        console.log("subtotal", subtotal);
        return isNaN(total) ? 0 : total;
    };

    const calculateProfitOfSale = () => {
        const profitTotal = selectedProduct.reduce((totalProfit, product) => {
            const productPrice = Number(getApplicablePrice(product));
            // console.log("product price", productPrice);
            const productCost = Number(getProductCost(product, product.selectedVariation));
            // console.log("product cost", productCost);
            const productQty = product.barcodeQty || 1;
            // console.log("product qty", productQty);
            const discount = Number(getDiscount(product, product.selectedVariation));
            // console.log("product discount", discount);
            const discountedPrice = productPrice - discount;
            // console.log("discounted price", discountedPrice);

            const totalProductCost = (productCost * productQty)
            // console.log("total product cost", totalProductCost);
            const subTotal = (discountedPrice * productQty);
            // console.log("sub total", subTotal);
            const profitOfProduct = subTotal - totalProductCost;
            console.log("profit of product", profitOfProduct);
            return totalProfit + profitOfProduct;
        }, 0);

        const totalPrice = calculateTaxLessTotal();
        console.log("total price", totalPrice);
        let discountValue = 0;
        if (discountType === 'fixed') {
            discountValue = Number(discount);
        } else if (discountType === 'percentage') {
            discountValue = (totalPrice * Number(discount)) / 100;
        }
        console.log("discount value", discountValue);
        // Grand total = productTotal - discount + shipping + globalTax
        const pureProfit = profitTotal - discountValue;
        console.log("pure profit", pureProfit);
        return pureProfit;
    };

  const calculateBalance = () => {
    const total = calculateTotal();
    const paidAmount = Object.values(amounts).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0
    );
    return total - paidAmount; // Balance = Grand Total - Paid Amount
  };

  const getApplicablePrice = (product) => {
    const qty =
      product.ptype === "Variation"
        ? product.variationValues?.[product.selectedVariation]?.barcodeQty || 0
        : product.barcodeQty || 0;

    if (product.ptype === "Variation") {
      const variation = product.variationValues?.[product.selectedVariation];
      if (!variation) return parseFloat(product.productPrice || 0);

      const meetsMinQty = qty >= (variation.wholesaleMinQty || 0);
      const wholesalePrice = parseFloat(variation.wholesalePrice || 0);

      return variation.wholesaleEnabled && meetsMinQty && wholesalePrice > 0
        ? wholesalePrice
        : parseFloat(variation.productPrice || 0);
    } else {
      const meetsMinQty = qty >= (product.wholesaleMinQty || 0);
      const wholesalePrice = parseFloat(product.wholesalePrice || 0);

      return product.wholesaleEnabled && meetsMinQty && wholesalePrice > 0
        ? wholesalePrice
        : parseFloat(product.price || product.productPrice || 0);
    }
  };
  
  const calculateRedeemedPoints = () => {
    const total = parseFloat(calculateTotal()) || 0;
    const loyaltyPoints = total * 0.01;
    // Keep full decimal precision
    return isNaN(loyaltyPoints) ? 0 : loyaltyPoints.toFixed(2);
  };

  const calculateDiscountValue = () => {
    const total = calculateBaseTotal();
    if (discountType === "fixed") {
      return Number(discount);
    } else if (discountType === "percentage") {
      return (total * Number(discount)) / 100;
    }
    return 0;
  };

  const handleDiscountType = (e) => {
    setDiscountType(e.target.value);
  };
  const handleDiscount = (e) => {
    const value = e.target.value;
    let errorMessage = "";

    if (discountType === "percentage") {
      const numericValue = parseFloat(value);
      if (numericValue < 1 || numericValue > 100) {
        errorMessage = "Percentage must be between 1 and 100.";
      }
    } else if (discountType === "fixed" && !numberRegex.test(value)) {
      errorMessage = "Discount must be a valid number.";
    }

    if (errorMessage) {
      setError(errorMessage);
    } else {
      setDiscount(value);
      setError("");
    }
  };

  const handleAmountChange = (type, value) => {
    // Allow empty value (user clearing the field)
    if (value === "") {
      setAmounts((prev) => ({
        ...prev,
        [type]: "",
      }));
      return;
    }

    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) {
      toast.error("Invalid amount entered.", { autoClose: 2000 });
      return;
    }

    const currentAmount = parseFloat(amounts[type]) || 0;

    // Safely calculate total amount from current state
    const totalAmount = Object.keys(amounts).reduce((acc, key) => {
      const val = parseFloat(amounts[key]);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    // Adjust total amount for the new value
    const newTotalAmount = totalAmount - currentAmount + numericValue;

    const saleTotal = parseFloat(calculateTotal());

    // Round both to two decimal places to avoid floating point issues
    const roundToTwo = (num) => Math.round(num * 100) / 100;
    const roundedNewTotal = roundToTwo(newTotalAmount);
    const roundedSaleTotal = roundToTwo(saleTotal);

    if (roundedNewTotal > roundedSaleTotal) {
      toast.error("Total amount cannot exceed the total value of the sale.", {
        autoClose: 2000,
        className: "custom-toast",
      });
      return;
    }

    // Update the amount state
    setAmounts((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleCheckboxChange = (type) => {
    setPaymentType((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  useEffect(() => {
    if (discountType === "fixed") {
      return setDiscountSymbole(currency);
    }
    if (discountType === "percentage") {
      return setDiscountSymbole("%");
    }
  }, [discountType]);

  const handleTax = (e) => {
    setTax(e.target.value);
  };
  const handleShipping = (e) => {
    setShipping(e.target.value);
  };

const handleClaimedPoints = () => {
    if (selectedCustomer && selectedCustomer.redeemedPoints > 0) {
        setIsPointsClaimed(true);
        // Set the actual points value from the customer's redeemedPoints
        setClaimedPoints(selectedCustomer.redeemedPoints.toString());
    }
};

  function restructureProductData(products) {
    if (!Array.isArray(products)) {
      console.error(
        "restructureProductData: products is not an array",
        products
      );
      return [];
    }
    return products.map((product) => {
      // If product is of type Variation
      if (
        product.ptype === "Variation" &&
        product.selectedVariation &&
        product.variationValues
      ) {
        const variationData =
          product.variationValues[product.selectedVariation];

        return {
          ...product,
          // Overwrite top-level fields with variation-level ones
          wholesaleEnabled: variationData?.wholesaleEnabled ?? false,
          wholesaleMinQty: variationData?.wholesaleMinQty ?? 0,
          wholesalePrice: variationData?.wholesalePrice ?? 0,
          productPrice: variationData?.productPrice ?? product.productPrice,
          productQty: variationData?.productQty ?? product.productQty,
          barcodeQty: variationData?.barcodeQty ?? product.barcodeQty,
        };
      }

      // For Single products, return as-is
      return product;
    });
  }

  useEffect(() => {
    const encryptedUser = sessionStorage.getItem("user");
    if (encryptedUser) {
      try {
        const user = decryptData(encryptedUser);
        setDecryptedUser(user);
      } catch (error) {
        sessionStorage.removeItem("user");
        alert("Session data corrupted. Please log in again.");
        return;
      }
    } else {
      console.error("User data could not be retrieved");
      alert("Could not retrieve user data. Please log in again.");
    }
  }, []);

  useEffect(() => {
    const fetchSettings = () => {
      if (!decryptedUser) {
        console.error("No decrypted user data available");
        return;
      }
      const preFix = decryptedUser.prefixes?.[0].salePrefix;
      if (!preFix) {
        console.error("No receipt settings available");
        setError("Receipt settings not found");
        return;
      }
      console.log("Fetched data:", preFix);
      setPreFix(preFix);
    };

    fetchSettings();
  }, [decryptedUser]);

  useEffect(() => {
    const total = totalWithoutInterest();
    const rate = parseFloat(creditDetails.interestRate) || 0;
    const months = parseInt(creditDetails.months) || 0;

    const interestAmount = (total * rate) / 100;
    const totalPayable = total + interestAmount;
    const monthlyInstallment =
      months > 0 ? (totalPayable / months).toFixed(2) : "";

    setCreditDetails((prev) => ({
      ...prev,
      interestAmount: interestAmount.toFixed(2),
      monthlyInstallment: monthlyInstallment,
    }));
  }, [
    creditDetails.interestRate,
    creditDetails.months,
    selectedProduct,
    discount,
    tax,
    shipping,
  ]);

  // Fetch services data
  const fetchServices = async () => {
    try {
      console.log('Fetching services from:', `${process.env.REACT_APP_BASE_URL}/api/findAllServiceNoPagination`);
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findAllServiceNoPagination`);
      console.log('Services API response:', response.data);
      if (response.data.status === 'success' && Array.isArray(response.data.services)) {
        console.log('Services fetched successfully:', response.data.services);
        setServices(response.data.services);
      } else {
        console.log('No services found or invalid response:', response.data);
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      console.error('Error details:', error.response?.data);
      setServices([]);
    }
  };

  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Handle service selection from popup
  const handleServiceSelect = (service) => {
    console.log('Service selected for sale:', service);
    
    // Add service to selected products with service-specific properties
    setSelectedProduct((prevProducts) => {
      const existingServiceIndex = prevProducts.findIndex(
        (product) => product.isService && product.id === service.id
      );

      if (existingServiceIndex !== -1) {
        // Service already exists, increment quantity (but for services, we just show it's already added)
        toast.info("Service is already added to the sale");
        return prevProducts;
      } else {
        // Add new service
        const newService = {
          ...service,
          isService: true,
          selectedVariation: null,
          quantity: 1, // Services typically have quantity 1
          productQty: 999999, // Unlimited availability for services
          stokeQty: 999999,
          productPrice: service.price,
          productCost: service.price,
          orderTax: service.orderTax || 0,
          taxType: service.taxType || 'exclusive',
          discount: service.discount || 0,
          discountType: service.discountType || 'fixed',
          saleUnit: 'Service',
          currentID: service.id || service._id // Use either id or _id from the service object
        };
        
        return [...prevProducts, newService];
      }
    });
    
    setIsServicesPopupOpen(false);
  };

  const handlePrintAndClose = () => {
    // Reset all relevant state
    setWarehouse("");
    setSearchTerm("");
    setSearchCustomer("");
    setFilteredCustomer([]);
    setSelectedCustomer([]);
    setFilteredProducts([]);
    setSelectedProduct([]);
    setDiscount("");
    setShipping("");
    setTax("");
    setOrderStatus("");
    setPaymentStatus("");
    setDiscountType("");
    setAmounts({ cash: "", card: "", bank_transfer: "" });
    setPaymentType({ cash: false, card: false, bank_transfer: false });
    setError("");
    setResponseMessage("");
    setBalance(0);
    setShouldPrint(false);
    setInvoiceNumber(null);
    setInvoiceData([]);

    // Redirect to sale view page
    navigate("/viewSale");
  };

    return (
        <div className='background-white relative left-[18%] w-[82%] min-h-[100vh]  p-5'>
            {progress && (
                <Box sx={{ width: '100%', position: "fixed", top: "80px", left: "18%", margin: "0", padding: "0", zIndex: 1200, }}>
                    <LinearProgress />
                </Box>
            )}
            <div className='mt-20 flex justify-between items-center'>
                <div>
                    <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Create Sale</h2>
                </div>
                <div>
                    <Link className='px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white' to={'/viewSale'}>Back</Link>
                </div>
            </div>
            <div className="bg-white mt-[20px] w-full rounded-2xl px-8 shadow-md pb-20">
                <div className="flex  flex-1 flex-col px-2 py-12 lg:px-8">
                    <form >
                        <div className="flex w-full space-x-5"> {/* Add space between inputs if needed */}
                            {/* warehouse*/}
                            <div className="flex-1"> {/* Use flex-1 to allow the field to take full width */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Select warehouse <span className='text-red-500'>*</span></label>
                                <select
                                    id="warehouse"
                                    name="warehouse"
                                    value={warehouse}
                                    onChange={(e) => handleWarehouseChange(e, setWarehouse, fetchProductDataByWarehouse, setProductData, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setLoading)}
                                    className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                >
                                    <option value="">Select a warehouse</option>
                                    {warehouseData.map((wh) => (
                                        <option key={wh.name} value={wh.name}>
                                            {wh.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* customer */}
                            <div className="flex-1 relative"> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Customer <span className='text-red-500'>*</span></label>
                                <input
                                    id="customer"
                                    name="customer"
                                    value={searchCustomer}
                                    required
                                    onChange={(e) => handleCustomerSearch(e, setSearchCustomer, setFilteredCustomer)}
                                    placeholder={"        Search..."}
                                    className="searchBox w-full pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                                />
                                {filteredCustomer.length > 0 && (
                                    <ul className="absolute z-10 mt-1 w-[344px] text-left bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredCustomer.map((customer) => (
                                            <li
                                                key={customer._id}
                                                onClick={() => handleCustomerSelect(customer, setSelectedCustomer, setSearchCustomer, setFilteredCustomer, setClaimedPoints, setIsPointsClaimed, setSelectedCustomerName)}
                                                className="cursor-pointer hover:bg-gray-100 px-4 py-4"
                                            >
                                                {customer.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/*Date*/}
                            <div className="flex-1 "> {/* Use flex-1 here as well */}
                                <label className="block text-sm font-medium leading-6 text-gray-900 text-left">Date <span className='text-red-500'>*</span></label>
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
                        </div>
                    </form>

                    {/*Product search*/}
                    <div className="flex-1 mt-5 relative" ref={dropdownRef}> 
                        <input
                            id="text"
                            name="text"
                            type="text"
                            required
                            value={searchTerm}
                            onChange={(e) => handleProductSearch(e, setSearchTerm, setFilteredProducts, warehouse)}
                            placeholder={searchTerm ? "" : "        Search..."}
                            className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6 ${!warehouse ? "bg-gray-200 cursor-not-allowed opacity-50" : ""
                                }`}
                            disabled={!warehouse}
                        />

                        {filteredProducts.length > 0 && (
                            <ul className="absolute left-0 z-10 w-full text-left bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                {filteredProducts.map((product) => (
                                    <li
                                        key={product._id}
                                        onClick={() => handleProductSelect(product, setSelectedProduct, setSearchTerm, setFilteredProducts)}
                                        className="cursor-pointer hover:bg-gray-100 px-4 py-4"
                                    >
                                        {product.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        {selectedProduct.length > 0 && (
                            <table className="mt-10 min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">tax</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variation</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProduct.map((product, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <span>{product.name}</span>
                                                    {(() => {
                                                        const price = getApplicablePrice(product);
                                                        const basePrice = getPriceRange(product, product.selectedVariation);
                                                        if (price < basePrice) {
                                                            return (
                                                                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-md border border-green-400">
                                                                    W
                                                                </span>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm ">
                                                <p className={`rounded-[5px] text-center p-[6px] ${product.isService ? 'bg-blue-100 text-blue-500' : 'bg-green-100 text-green-500'}`}>
                                                    {product.isService ? 'Service' : (product.productQty || getQty(product, product.selectedVariation))}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4 text-left  whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => handleQtyChange(index, product.selectedVariation, setSelectedProduct, -1)} // Decrement
                                                        className={`px-2 py-2 rounded ${product.isService ? 'bg-gray-200 cursor-not-allowed opacity-50' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                        disabled={product.isService}
                                                    >
                                                        <img className='w-[16px] h-[16px]' src={Decrease} alt='decrease' />
                                                    </button>
                                                    {/* Input Field */}
                                                    <input
                                                        type="number"
                                                        value={product.isService ? 1 : (product.ptype === "Variation"
                                                            ? product.variationValues[product.selectedVariation]?.barcodeQty || 1
                                                            : product.barcodeQty || 1)
                                                        }
                                                        onChange={(e) =>
                                                            !product.isService && handleQtyChange(index, product.selectedVariation, setSelectedProduct, e.target.value)
                                                        }
                                                        className={`mx-2 w-16 py-[6px] text-center border rounded outline-none ${product.isService ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-1 focus:ring-blue-100'}`}
                                                        min="1"
                                                        disabled={product.isService}
                                                        readOnly={product.isService}
                                                    />

                                                    <button
                                                        onClick={() => handleQtyChange(index, product.selectedVariation, setSelectedProduct, 1)} // Increment            
                                                        className={`px-2 py-2 rounded ${product.isService ? 'bg-gray-200 cursor-not-allowed opacity-50' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                        disabled={product.isService}
                                                    >
                                                        <img className='w-[16px] h-[16px] transform rotate-180' src={Decrease} alt='increase' />
                                                    </button>
                                                </div>
                                            </td>


                                            {/* Product Price */}
                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {currency}  {getApplicablePrice(product).toFixed(2)}
                                            </td>

                                            {/* Display Product Tax */}
                                            <td className="px-6 py-4 text-left  whitespace-nowrap text-sm text-gray-500">
                                                {product.orderTax
                                                    ? `${product.orderTax}%`
                                                    : `${getTax(product, product.selectedVariation)}%`}
                                            </td>

                                   
<td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
    {currency}  {
        (() => {
            const price = getApplicablePrice(product);
            const quantity = product.variationValues?.[product.selectedVariation]?.barcodeQty || product.barcodeQty || 1;
            const taxRate = product.orderTax ? product.orderTax / 100 : getTax(product, product.selectedVariation) / 100;
            const discount = getDiscount(product, product.selectedVariation);
            const discountedPrice = price - discount;

           const taxType = product.ptype === "Variation"
                ? product.variationValues?.[product.selectedVariation]?.taxType
                : product.taxType;

            let subtotal;
            if (taxType === "Inclusive") {
                subtotal = discountedPrice * quantity;
            } else {
                subtotal = (discountedPrice * quantity) + (price * quantity * taxRate);
            }
            return formatWithCustomCommas(subtotal);
        })()
    }
</td>

                                            <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                                                {product.ptype === 'Variation' && product.variationValues ? (
                                                    <select
                                                        value={product.selectedVariation}
                                                        onChange={(e) => handleVariationChange(index, e.target.value, setSelectedProduct)}
                                                        className="block w-full border py-2 border-gray-300 rounded-md shadow-sm focus:border-transparent"
                                                    >
                                                        {Object.keys(product.variationValues).map((variationKey) => (
                                                            <option key={variationKey} value={variationKey}>
                                                                {variationKey}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span>No Variations</span>
                                                )}
                                            </td>


                                            {/* Delete Action */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() => handleDelete(index, selectedProduct, setSelectedProduct)}
                                                    className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                                >
                                                    <i className="fas fa-trash mr-1"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
              </table>
            )}
          </div>

          <div className="">
            {/* ADD SERVICES BUTTON */}
            <div className="mb-6 mt-4">
              <button
                onClick={() => setIsServicesPopupOpen(true)}
                className="px-6 py-3 bg-[#44BC8D] text-white rounded-lg hover:bg-[#3a9d7a] transition-colors duration-200 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Services
              </button>
            </div>

            {/* DISCOUNT, SHIPPING AND TAX INPUT */}
            <div className="grid grid-cols-5 gap-5 mb-4 mt-60">
              <div className="relative">
                <label className="block text-left text-sm font-medium text-gray-700">
                  Discount Type:
                </label>
                <select
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      alert("Please select a discount type.");
                    }
                    handleDiscountType(e);
                  }}
                  value={discountType}
                  className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                >
                  <option value="">Discount type</option>
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              <div className="relative">
                <label className="block text-left text-sm font-medium text-gray-700">
                  Discount:
                </label>
                <input
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*\.?\d*$/.test(value)) {
                      alert("Only numbers are allowed for discount.");
                      return;
                    }
                    handleDiscount({ target: { value } });
                  }}
                  value={discount}
                  type="text"
                  placeholder="Discount"
                  className="block w-full rounded-md border-0 py-2.5 pr-10 pl-2 text-gray-900 shadow-sm ring-1 ring-gray-400 placeholder:text-gray-400 focus:ring-gray-400 focus:outline-none sm:text-sm"
                />
                <span className="absolute inset-y-0 right-2 flex items-center text-gray-500 pr-2">
                  {discountSymbole}
                </span>
              </div>

              <div className="relative">
                <label className="block text-left text-sm font-medium text-gray-700">
                  Tax:
                </label>
                <input
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*\.?\d*$/.test(value)) {
                      alert("Only numbers are allowed for tax.");
                      return;
                    }
                    handleTax({ target: { value } });
                  }}
                  value={tax}
                  type="text"
                  placeholder="Tax"
                  className="block w-full rounded-md border-0 py-2.5 pr-10 pl-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                />
                <span className="absolute inset-y-0 right-2 flex items-center text-gray-500 pr-2">
                  %
                </span>
              </div>

              <div className="relative">
                <label className="block text-left text-sm font-medium text-gray-700">
                  Shipping:
                </label>
                <input
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*\.?\d*$/.test(value)) {
                      alert("Only numbers are allowed for shipping.");
                      return;
                    }
                    handleShipping({ target: { value } });
                  }}
                  value={shipping}
                  type="text"
                  placeholder="Shipping"
                  className="block w-full rounded-md border-0 py-2.5 pr-10 pl-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                />
                <span className="absolute inset-y-0 right-2 flex items-center text-gray-500 pr-2">
                  {currency}
                </span>
              </div>

              <div className="relative">
                <label className="block text-left text-sm font-medium text-gray-700">
                  Claimed Points:
                </label>
                <input
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*\.?\d*$/.test(value)) {
                      alert("Only numbers are allowed for loyalty points.");
                      return;
                    }
                    handleClaimedPoints({ target: { value } });
                  }}
                  value={claimedPoints}
                  disabled
                  placeholder="Claimed Points"
                  readOnly={isPointsClaimed}
                  className={`block w-full rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm ${
                    isPointsClaimed ? "bg-green-50" : ""
                  }`}
                />
                {selectedCustomer?.redeemedPoints > 0 && !isPointsClaimed && (
                  <button
                    onClick={handleClaimedPoints}
                    className="absolute right-2 top-7 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Claim
                  </button>
                )}
                {isPointsClaimed && (
                  <span className="absolute right-2 top-8 text-xs text-green-600">
                    ✓ Claimed
                  </span>
                )}

                {/* Move the message here, just below the input field */}
                <span className="text-xs text-gray-500 mt-1 block">
                  {isPointsClaimed
                    ? `${claimedPoints} points will be deducted from total`
                    : "Customer's available loyalty points"}
                </span>
              </div>
            </div>

            {/* Order, Payment Status, and Payment Type Selects */}
            <div className="flex justify-between gap-4 mt-10">
              <div className="w-1/2">
                <label className="text-left block text-sm font-medium text-gray-700">
                  Status: <span className="text-red-500">*</span>
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                >
                  <option value="">Select Order Status</option>
                  <option value="ordered">Ordered</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Payment Status Select */}
              <div className="w-1/2 text-right">
                <label className="text-left block text-sm font-medium text-gray-700">
                  Payment Status: <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="searchBox w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
                >
                  <option value="">Select Payment Status</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            <div className="mt-10">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="creditPayment"
                  checked={useCreditPayment}
                  onChange={() => {
                    const newValue = !useCreditPayment;

                    if (newValue && paymentStatus !== "partial") {
                      toast.error(
                        "To use credit payment, please select 'Partial' as payment status."
                      );
                      return;
                    }

                    setUseCreditPayment(newValue);
                  }}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="creditPayment"
                  className="text-sm text-gray-700 font-medium"
                >
                  Pay with Credit
                </label>
              </div>

              {useCreditPayment && paymentStatus === "partial" && (
                <div className="mt-4 p-4 border border-gray-300 rounded-md bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interest Rate (%)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={creditDetails.interestRate}
                        onChange={(e) =>
                          setCreditDetails((prev) => ({
                            ...prev,
                            interestRate: e.target.value,
                          }))
                        }
                        placeholder="e.g. 5 (or leave blank for 0%)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Installment Months
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={creditDetails.months}
                        onChange={(e) =>
                          setCreditDetails((prev) => ({
                            ...prev,
                            months: e.target.value,
                          }))
                        }
                        placeholder="e.g. 6"
                      />
                    </div>
                  </div>

                  {/* Summary Display */}
                  {creditDetails.months && (
                    <div className="mt-6 text-right space-y-2 text-blue-700">
                      <p>
                        <strong>Interest:</strong> {currency}{" "}
                        {formatWithCustomCommas(
                          (
                            (totalWithoutInterest() *
                              (parseFloat(creditDetails.interestRate) || 0)) /
                            100
                          ).toFixed(2)
                        )}
                      </p>
                      <p>
                        <strong>Monthly Installment:</strong> {currency}{" "}
                        {formatWithCustomCommas(
                          (
                            calculateTotal() / parseInt(creditDetails.months)
                          ).toFixed(2)
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Type Select */}
            <div className="mt-10 mb-14 w-full">
              <div>
                <label className="text-left block text-sm font-medium text-gray-700">
                  Payment Type: <span className="text-red-500">*</span>
                </label>
                <div className="mt-4 flex gap-10 w-full">
                  {Object.keys(paymentType).map((type) => (
                    <div
                      key={type}
                      className="flex items-center space-x-2 relative"
                    >
                      <input
                        type="checkbox"
                        id={type}
                        checked={paymentType[type]}
                        onChange={() => handleCheckboxChange(type)}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={type}
                        className="text-sm text-gray-700 capitalize"
                      >
                        {type.replace("_", " ")}
                      </label>
                      {paymentType[type] && (
                        <div className="relative">
                          <input
                            type="number"
                            value={amounts[type]}
                            onChange={(e) =>
                              handleAmountChange(type, e.target.value)
                            }
                            placeholder="Enter amount"
                            className="block w-44 rounded-md border-0 pl-4 py-2.5 pr-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-xs text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                          />
                          <span className="absolute inset-y-0 right-2 flex items-center text-gray-500">
                            {currency}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-right text-lg font-semibold">
            Balance: {currency} {formatWithCustomCommas(calculateBalance())}
          </div>
          <div className="mt-4 text-right text-lg font-semibold">
            Total: {currency} {formatWithCustomCommas(calculateTotal())}
          </div>

          <div className="mt-4 text-right text-lg font-semibold">
            Profit: {currency} {formatWithCustomCommas(calculateProfitOfSale())}
          </div>

          <div className="mt-4 text-right text-lg font-semibold">
            Redeemed Points From Total Sale (1%):{" "}
            {formatWithCustomCommas(calculateRedeemedPoints())}
          </div>

          <div className="container mx-auto text-left">
            <div className="mt-10 flex justify-start">
              <button
                onClick={() => {
                  const totalPayment = Object.values(amounts).reduce(
                    (sum, val) => sum + (parseFloat(val) || 0),
                    0
                  );

                  if (paymentStatus === "partial" && totalPayment <= 0) {
                    toast.error(
                      "Partial payment requires at least one payment amount."
                    );
                    return;
                  }

                  const restructuredProducts =
                    restructureProductData(selectedProduct);
                  console.log("Restructured products:", restructuredProducts);
                  console.log(
                    "Type:",
                    Array.isArray(restructuredProducts)
                      ? "Array"
                      : typeof restructuredProducts
                  );

                  handleSave(
                    calculateTotal().toFixed(2),
                    calculateBaseTotal().toFixed(2),
                    calculateProfitOfSale().toFixed(2),
                    orderStatus,
                    paymentStatus,
                    paymentType,
                    amounts,
                    shipping,
                    discountType,
                    discount,
                    tax,
                    warehouse,
                    selectedCustomer?._id || "unknown",
                    selectedCustomerName,
                    restructureProductData(selectedProduct),
                    date,
                    preFix,
                    "0",
                    setInvoiceNumber,
                    setResponseMessage,
                    setError,
                    setProgress,
                    setInvoiceData,
                    note,
                    balance,
                    handlePrintAndClose,
                    shouldPrint,
                    calculateDiscountValue(),
                    useCreditPayment,
                    creditDetails,
                    isPointsClaimed ? claimedPoints : 0,
                    sessionStorage.getItem('cashierUsername'), // cashierID (same as POS cashierUsername) - becomes cashRegisterKey
                    sessionStorage.getItem('cashRegisterID'), 
                    () => {}, // setFetchRegData (placeholder function)
                    calculateRedeemedPoints()
                  );
                }}
                className="mt-5 submit  w-[200px] text-white rounded py-2 px-4"
              >
                Save sale
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Services Popup Modal */}
      <ServicesPopupModal
        isOpen={isServicesPopupOpen}
        onClose={() => setIsServicesPopupOpen(false)}
        services={services}
        onServiceSelect={handleServiceSelect}
        warehouse={warehouse}
        currency={currency}
      />
    </div>
  );
}
export default CreateSaleBody;
