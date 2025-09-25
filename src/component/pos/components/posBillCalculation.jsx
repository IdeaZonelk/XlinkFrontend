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
import PayingSection from "./payingSection";
import delSound from '../../../../src/audio/delet pop.mp3';
import axios from 'axios';
import { useCurrency } from '../../../context/CurrencyContext';
import formatWithCustomCommas from '../../utill/NumberFormate';
import { UserContext } from '../../../context/UserContext';
import GiftIcon from '../../../img/giftbox.png';
import { toast } from 'react-toastify';

const BillingSection = ({ productBillingHandling, setProductBillingHandling, setProductData, selectedCustomer, selectedCustomerName, selectedCustomerData, setSelectedCustomer, setSelectedCustomerName, setSelectedCustomerData, warehouse, setReloadStatus, setHeldProductReloading, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setError, setFetchRegData }) => {

      if (productBillingHandling && productBillingHandling.length > 0) {
        productBillingHandling.forEach((product, idx) => {
            console.log(`Product ${idx}: name=${product.name}, productCost=${product.productCost}`);
        });
    }
    const { currency } = useCurrency();
    const [permissionData, setPermissionData] = useState({});
    const { userData } = useContext(UserContext);
    const [productDetailsForPrinting, setProductDetailsForPrinting] = useState([]);
    const [productDetailsForHolding, setProductDetailsForHolding] = useState([]);
    const [refferenceNumber, setRefferenceNumber] = useState('')
    const [showPayingSec, setShowPayingSection] = useState(false)
    const [showProductHolding, setShowProductHolding] = useState(false)
    const [discountType, setDiscountType] = useState('fixed');
    const [discountSymbole, setDiscountSymbole] = useState(currency);
    const [discount, setDiscount] = useState('')
    const [shipping, setShipping] = useState('')
    const [tax, setTax] = useState('');
    const [totalItems, setTotalItems] = useState(0);
    const [totalPcs, setTotalPcs] = useState(0);
    const [profit, setProfit] = useState(0);
    const [openAuthModel, setOpenAuthModel] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [specialDiscountPopUp, setSpecialDiscountPopUp] = useState(false);
    const [specialDiscount, setSpecialDiscount] = useState(0);
    const [specialDiscountType, setSpecialDiscountType] = useState('');
    const [specialDiscountInput, setSpecialDiscountInput] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [selectedProductIndex, setSelectedProductIndex] = useState(null);
    const [offersData, setOffers] = useState([]);
    const [openOffersModel, setOpenOffersModel] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState('');
    const [offerPercentage, setOfferPercentage] = useState(0);
    const [progress, setProgress] = useState(false);
    // Add this near your other state declarations
    const [claimedPoints, setClaimedPoints] = useState(0);
    const [isPointsClaimed, setIsPointsClaimed] = useState(false);
    const adminPasswordRef = useRef(null);
    // const [selectedCustomerData, setSelectedCustomerData] = useState(null);
    const discountInputRef = useRef(null);
    const [useCreditPayment, setUseCreditPayment] = useState(false);
    const [creditDetails, setCreditDetails] = useState({
        interestRate: '',
        months: '',
        interestAmount: '',
        monthlyInstallment: '',
    });

    // Add this debug useEffect at the top of your component
useEffect(() => {
  console.log("DEBUG - productBillingHandling:", productBillingHandling);
  if (productBillingHandling && productBillingHandling.length > 0) {
    productBillingHandling.forEach((product, index) => {
      console.log(`Product ${index}:`, {
        name: product.name,
        ptype: product.ptype,
        qty: product.qty,
        price: product.price,
        productCost: product.productCost,
        tax: product.tax,
        taxType: product.taxType,
        hasVariation: !!product.selectedVariation,
        variationData: product.selectedVariation ? product.variationValues?.[product.selectedVariation] : null
      });
    });
  }
}, [productBillingHandling]);
    const getApplicablePrice = (product) => {
        const qty = product.qty || 0;

        if (product.selectedVariation) {
            const variation = product.variationValues?.[product.selectedVariation];

            // ✅ NEW: fallback if variationValues is empty (held product case)
            if (!variation && product.wholesaleEnabled) {
                const meetsMinQty = qty >= (product.wholesaleMinQty || 0);
                const wholesalePrice = parseFloat(product.wholesalePrice || 0);
                if (meetsMinQty && wholesalePrice > 0) return wholesalePrice;
                return parseFloat(product.price || 0); // fallback
            }

            if (variation) {
                const hasWholesale = variation.wholesaleEnabled === true;
                const meetsMinQty = qty >= (variation.wholesaleMinQty || 0);
                const wholesalePrice = parseFloat(variation.wholesalePrice || 0);

                if (hasWholesale && meetsMinQty && wholesalePrice > 0) {
                    return wholesalePrice;
                }

                return parseFloat(variation.productPrice || 0);
            }

            return parseFloat(product.price || 0);
        } else {
            const hasWholesale = product.wholesaleEnabled === true;
            const meetsMinQty = qty >= (product.wholesaleMinQty || 0);
            const wholesalePrice = parseFloat(product.wholesalePrice || 0);

            if (hasWholesale && meetsMinQty && wholesalePrice > 0) {
                return wholesalePrice;
            }

            return parseFloat(product.price || 0);
        }
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

    useEffect(() => {
        if (specialDiscountPopUp) {
            setTimeout(() => {
                discountInputRef.current?.focus();
            }, 100);
        }
    }, [specialDiscountPopUp]);

    const handleClaimPoints = () => {
        console.log('handleClaimPoints - selectedCustomerData:', selectedCustomerData);
        console.log('handleClaimPoints - redeemedPoints:', selectedCustomerData?.redeemedPoints);
        if (!selectedCustomerData || !selectedCustomerData.redeemedPoints) {
            toast.error('No points available to claim');
            return;
        }

        if (isPointsClaimed) {
            toast.info('Points already claimed');
            return;
        }
        console.log('[posBillCalculation] handleClaimPoints - Current selectedCustomerData.redeemedPoints:', selectedCustomerData?.redeemedPoints);
        console.log('[posBillCalculation] handleClaimPoints - Current calculatedLoyaltyPoints:', calculateLoyaltyPoints());
        const pointsToClaim = selectedCustomerData.redeemedPoints;
        const pointsValue = pointsToClaim; // 1 point = 1 currency unit
        console.log('[posBillCalculation] handleClaimPoints - Points to claim:', pointsToClaim);

        setClaimedPoints(pointsToClaim);
        setIsPointsClaimed(true);
        console.log('[posBillCalculation] handleClaimPoints - claimedPoints set to:', pointsToClaim);

        toast.success(`Successfully claimed ${pointsToClaim} points (${currency}${pointsValue})`);
    };


    // Handle discount type change in modal
    const handleSpecialDiscountTypeChange = (e) => {
        setSpecialDiscountType(e.target.value);
        setSpecialDiscountInput('');
        setSpecialDiscount(0);
    };

    // Handle discount value change in modal

    const handleSpecialDiscountInputChange = (e) => {
        const value = e.target.value;
        setSpecialDiscountInput(value);
        if (specialDiscountType === 'fixed') {
            setSpecialDiscount(Number(value));
        } else if (specialDiscountType === 'percentage') {
            // Calculate discount for selected product
            if (selectedProductIndex !== null) {
                const product = productBillingHandling[selectedProductIndex];
                let basePrice, productDiscount, productTax;

                if (product.selectedVariation && product.variationValues) {
                    const variation = product.variationValues[product.selectedVariation];
                    basePrice = Number(variation?.productPrice) || 0;
                    productDiscount = Number(variation?.discount) || 0;
                    productTax = Number(variation?.orderTax) || 0;
                } else {
                    basePrice = Number(product.price) || 0;
                    productDiscount = Number(product.discount) || 0;
                    productTax = Number(product.tax) || 0;
                }

                let discountedPrice = basePrice - productDiscount;
                let taxedPrice = discountedPrice + (basePrice * productTax / 100);
                let percentDiscount = taxedPrice * (Number(value) / 100);

                setSpecialDiscount(Number(percentDiscount.toFixed(2)));
            } else {
                setSpecialDiscount(0);
            }
        } else {
            setSpecialDiscount(0);
        }
    };

    // Add special discount to product
    const handleAddSpecialDiscount = () => {
        if (selectedProductIndex !== null) {
            const updatedProducts = [...productBillingHandling];
            updatedProducts[selectedProductIndex].specialDiscount = parseFloat(specialDiscount) || 0;
            updatedProducts[selectedProductIndex].specialDiscountType = specialDiscountType;
            updatedProducts[selectedProductIndex].specialDiscountInput = specialDiscountInput;
            setProductBillingHandling(updatedProducts);
            setSpecialDiscountPopUp(false);
            setSelectedProductIndex(null);
            setTimeout(() => {
                calculateTotalPrice();
                setSpecialDiscount('');
                setSpecialDiscountType('');
                setSpecialDiscountInput('');
            }, 0);
        }
    };

    useEffect(() => {
        calculateTotalPrice();
    }, [productBillingHandling, creditDetails, useCreditPayment, discount, tax, shipping, offerPercentage]);


    /*     const handleDiscountAccess = async (e) => {
            e.preventDefault();
            if (!username || !password) {
                alert('Please enter both username and password.');
                return;
            }
            const data = { username: username, password: password };
            try {
                const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/getDiscountAccess`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);

                }
                const result = await response.json();
                const status = result.status;
                sessionStorage.setItem('status', status);
                if (status === 'success') {
                    setSpecialDiscountPopUp(true);
                    if (discountInputRef.current) {
                        discountInputRef.current.focus();
                    }
                    toast.success('Access granted successfully!');
                } else {
                    toast.error('Access denied. Please check your credentials.');
                }

                }
                const result = await response.json();
                const status = result.status;
                sessionStorage.setItem('status', status);
                if (status === 'success') {
                    setSpecialDiscountPopUp(true);
                    if (discountInputRef.current) {
                        discountInputRef.current.focus();
                    }
                    toast.success('Access granted successfully!');
                } else {
                    toast.error('Access denied. Please check your credentials.');
                }

                setOpenAuthModel(false);
            } catch (error) {
                console.error('There was a problem with your fetch operation:', error);
                toast.error('An error occurred while processing your request.');
            }
        }; */

    const fetchOfferData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchOffers`, {
                params: {
                    sort: '-createdAt'
                },
            });
            setOffers(response.data.offers);
        } catch (error) {
            setOffers([]);
        } finally {
            //setLoading(false);
        }
    };
    useEffect(() => {
        fetchOfferData();
    }, []);

    const handleOfferChange = (e) => {
        const selectedOfferId = e.target.value;
        setSelectedOffer(selectedOfferId);

        if (selectedOfferId === '') {
            setSelectedOffer('');
            setOfferPercentage(0);
            setOpenOffersModel(false)
        }
        else {
            const selectedOfferObj = offersData.find(offer => offer.offerName === selectedOfferId);
            if (selectedOfferObj) {
                const percentage = selectedOfferObj.percentage;
                console.log(percentage)
                setOfferPercentage(selectedOfferObj.percentage);
                setOpenOffersModel(false)
            }
        }
    };

    useEffect(() => {
        const fetchReferenceNumber = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/generateHoldReferenceNo`); // Call new API
                if (response.data && response.data.referenceNo) {
                    setRefferenceNumber(response.data.referenceNo);
                }
            } catch (error) {
                console.error('Error generating reference number:', error);
            }
        };

        if (showProductHolding) {
            fetchReferenceNumber();
        }
    }, [showProductHolding]);


    const handleIncrement = (index) => {
        setProductBillingHandling((prev) => {
            const product = prev[index];
            
            // Prevent incrementing services
            if (product.isService) {
                return prev;
            }
            
            const variation = product.selectedVariation
                ? product.variationValues[product.selectedVariation]
                : null;
            const availableStock = variation ? variation.productQty : product.stokeQty;

            if (product.qty >= availableStock) {
                alert(`Cannot increase more, only ${availableStock} in stock.`);
                return prev;
            }

            return prev.map((p, i) => (i === index ? { ...p, qty: p.qty + 1 } : p));
        });
    };

    const handleQtyChange = (e, index) => {
        const inputValue = e.target.value;
        const newQty = Number(inputValue);
        const product = productBillingHandling[index];
        
        // Prevent quantity changes for services
        if (product.isService) {
            return;
        }
        
        const variation = product.selectedVariation
            ? product.variationValues[product.selectedVariation]
            : null;
        const availableStock = variation ? variation.productQty : product.stokeQty;

        if (inputValue === "") {
            setProductBillingHandling((prev) =>
                prev.map((p, i) => (i === index ? { ...p, qty: "" } : p))
            );
            return;
        }
        if (isNaN(newQty) || newQty < 1) {
            alert("Quantity must be at least 1.");
            return;
        }
        if (newQty > availableStock) {
            alert(`Cannot enter more than ${availableStock} in stock.`);
            return;
        }
        setProductBillingHandling((prev) =>
            prev.map((p, i) => (i === index ? { ...p, qty: newQty } : p))
        );
    };

    // useEffect for validating quantities when loading held products for editing
    useEffect(() => {
        const adjustQuantitiesForStock = () => {
            setProductBillingHandling((prevProducts) =>
                prevProducts.map((product) => {
                    const variation = product.selectedVariation
                        ? product.variationValues[product.selectedVariation]
                        : null;
                    const availableStock = variation ? variation.productQty : product.stokeQty;
                    if (product.qty > availableStock) {
                        alert(
                            `Quantity for "${product.name}" adjusted to available stock (${availableStock}).`
                        );
                        return { ...product, qty: availableStock };
                    }
                    return product;
                })
            );
        };

        adjustQuantitiesForStock();
    }, []);


    // Handle decrementing the quantity of a product or its variation
    const handleDecrement = (index) => {
        setProductBillingHandling((prev) =>
            prev.map((product, i) => {
                // Prevent decrementing services
                if (product.isService) {
                    return product;
                }
                
                if (i === index && product.qty > 1) {
                    return { ...product, qty: product.qty - 1 };
                }
                return product;
            })
        );
    };

    // Handle deleting a product or its variation from the list
    const handleDelete = (index) => {
        setProductBillingHandling((prev) => prev.filter((_, i) => i !== index));
    };

 

const getRowSubtotal = (product) => {
  const variation = product.selectedVariation
    ? product.variationValues?.[product.selectedVariation]
    : null;

  const price = getApplicablePrice(product);
  console.log("price", price);
  
  // Get tax from the right source - use product.tax (which now comes from warehouse)
  const tax = variation?.orderTax !== undefined 
    ? parseFloat(variation.orderTax) 
    : parseFloat(product.tax) || 0; // Changed to use product.tax
  console.log("tax", tax);
  
  // Get taxType from the right source - use product.taxType (which now comes from warehouse)
  const taxType = variation?.taxType !== undefined 
    ? variation.taxType 
    : product.taxType || 'exclusive'; // This should now have the correct value
  console.log("taxType", taxType);
  
  const discount = variation?.discount !== undefined 
    ? parseFloat(variation.discount) 
    : parseFloat(product.discount) || 0;
  console.log("discount", discount);
  
  const qty = product.qty || 0;
  console.log("qty", qty);
  
  const specialDiscount = parseFloat(product.specialDiscount) || 0;

  const newPrice = price - discount - specialDiscount;
  console.log("newPrice", newPrice);

  // Calculate product total based on tax type
  let productTotal;
  if (taxType && taxType.toLowerCase() === 'inclusive') {
    // Tax is already included in the price, don't add additional tax
    productTotal = newPrice * qty;
  } else {
    // Tax is exclusive, add tax to the price
    productTotal = (newPrice * qty) + ((price * qty * (tax / 100)));
  }
  console.log("productTotal", productTotal);
  
  return productTotal.toFixed(2);
};

const calculateBaseTotal = () => {
  return productBillingHandling
    .filter(product => product.ptype !== 'Base')
    .reduce((acc, product) => {
      const variation = product.selectedVariation
        ? product.variationValues?.[product.selectedVariation]
        : null;

      const price = getApplicablePrice(product);
      const tax = variation?.orderTax !== undefined ? parseFloat(variation.orderTax) : parseFloat(product.tax) || 0; // Use product.tax
      const taxType = variation?.taxType !== undefined ? variation.taxType : product.taxType || 'exclusive'; // Add taxType check
      const discount = variation?.discount !== undefined ? parseFloat(variation.discount) : parseFloat(product.discount) || 0;

      const qty = product.qty || 0;
      const specialDiscount = parseFloat(product.specialDiscount) || 0;
      const newPrice = price - discount - specialDiscount;

      if (isNaN(newPrice) || isNaN(tax) || isNaN(qty)) {
        console.warn(`[WARNING] Skipping product due to NaN values: ${product.name}`, { newPrice, tax, qty });
        return acc;
      }

      let productTotal;
      if (taxType && taxType.toLowerCase() === 'inclusive') {
        // Tax is already included in the price, don't add additional tax
        productTotal = newPrice * qty;
      } else {
        // Tax is exclusive, add tax to the price
        productTotal = (newPrice * qty) + ((price * qty * (tax / 100)));
      }

      return acc + productTotal;
    }, 0);
};

    //calculating total price
    const calculateTotalPrice = () => {
        let total = calculateBaseTotal();

        let discountAmount = 0;
        if (discountType === 'fixed') {
            discountAmount = parseFloat(discount) || 0;
        } else if (discountType === 'percentage') {
            discountAmount = (total * (parseFloat(discount) || 0) / 100);
        }

        const taxAmount = (total * (parseFloat(tax) || 0) / 100);
        const shippingCost = parseFloat(shipping) || 0;
        const offerDiscountAmount = total * (parseFloat(offerPercentage || 0) / 100);

        let interestAmount = useCreditPayment ? parseFloat(creditDetails.interestAmount || 0) : 0;

        // Apply discounts first
        total = total - discountAmount - offerDiscountAmount + taxAmount + shippingCost + interestAmount;

        // Then subtract claimed points (1 point = 1 currency unit)
        if (isPointsClaimed) {
            total = total - claimedPoints;
        }

        // Ensure total doesn't go below 0
        total = Math.max(0, total);

        return isNaN(total) ? "0.00" : total.toFixed(2);
    };

    // useEffect(() => {
    //     const newTotal = calculateTotalPrice();
    //     setTotalPrice(newTotal); // Ensure state updates the total price
    // }, [productBillingHandling]);


  const calculateTaxLessTotal = () => {
        let subtotal = productBillingHandling
            .filter(product => product.ptype !== 'Base')
            .reduce((acc, product) => {
                const variation = product.selectedVariation
                    ? product.variationValues?.[product.selectedVariation]
                    : null;

                const price = parseFloat(variation?.price) || parseFloat(product.price) || 0;
                const discount = variation?.discount !== undefined ? parseFloat(variation.discount) : parseFloat(product.discount) || 0;
                const specialDiscount = parseFloat(product.specialDiscount) || 0;

                const qty = product.qty || 0;

                const netPrice = (price - discount - specialDiscount) * qty;
                const productSubtotal = netPrice;
                return acc + productSubtotal;
            }, 0);
        const total = subtotal;
        return isNaN(total) ? 0 : total;
    };

    const calculateProfit = () => {
        let subtotal = productBillingHandling
            .filter(product => product.ptype !== 'Base')
            .reduce((acc, product) => {
                const variation = product.selectedVariation
                    ? product.variationValues?.[product.selectedVariation]
                    : null;
                const price = parseFloat(variation?.price) || parseFloat(product.price) || 0;
                const discount = variation?.discount !== undefined
                    ? parseFloat(variation.discount)
                    : parseFloat(product.discount) || 0;

                const specialDiscount = parseFloat(product.specialDiscount) || 0;

                const productCost = variation?.productCost !== undefined
                    ? parseFloat(variation.productCost)
                    : parseFloat(product.productCost) || 0;

                const qty = product.qty || 0;

                const netPrice = (price - discount - specialDiscount) * qty;
                const productSubtotal = netPrice ;
                const totalCost = (productCost * qty);

                return acc + (productSubtotal - totalCost);
            }, 0);

        const totalPrice = calculateTaxLessTotal();
        let discountAmount = 0;
        if (discountType === 'fixed') {
            discountAmount = parseFloat(discount) || 0;
        } else if (discountType === 'percentage') {
            discountAmount = (totalPrice * (parseFloat(discount) || 0) / 100);
        }
        const offerDiscountAmount = totalPrice * (parseFloat(offerPercentage) / 100);
        const totalProfit = subtotal - discountAmount - offerDiscountAmount;

        return totalProfit;
    };

    useEffect(() => {
        const calculatedProfit = calculateProfit();
        setProfit(calculatedProfit);
    }, [productBillingHandling, discountType, discount, offerPercentage, calculateTaxLessTotal]);

    const calculateDiscountAmount = (baseTotal) => {
        let discountAmount = 0;
        if (discountType === 'fixed') {
            discountAmount = parseFloat(discount) || 0;
        } else if (discountType === 'percentage') {
            discountAmount = (baseTotal * (parseFloat(discount) || 0)) / 100;
        }
        return discountAmount;
    };
// Add this useEffect to call and log taxLessTotal
// Add these useEffects to your component
useEffect(() => {
  const taxLessTotal = calculateTaxLessTotal();
  console.log("Tax Less Total:", taxLessTotal);
}, [productBillingHandling, discount, offerPercentage]);

// useEffect(() => {
//   const calculatedProfit = calculateProfit();
//   console.log('Profit Details:', calculatedProfit);
// }, [productBillingHandling, discount, tax, shipping, offerPercentage]);

    const calculateTotalItemsAndPcs = () => {
        let itemsCount = 0;
        let pcsCount = 0;
        productBillingHandling
            .filter(product => product.ptype !== 'Base')
            .forEach(product => {
                if (product.qty > 0) {
                    itemsCount += 1;
                    pcsCount += product.qty;
                }
            });
        return { itemsCount, pcsCount };
    };

    useEffect(() => {
        const { itemsCount, pcsCount } = calculateTotalItemsAndPcs();
        setTotalItems(itemsCount);
        setTotalPcs(pcsCount);
    }, [productBillingHandling]);


    // Reset the billing section (clear the cart)
    const handleBillReset = () => {
        setProductBillingHandling([]);
        setDiscount('');
        setShipping('');
        setTax('');
        setSelectedCustomer('');
        setSelectedCustomerName('');
        setSelectedCustomerData(null);
        setSelectedOffer('');
        setOfferPercentage(0);
        setClaimedPoints(0);
        setIsPointsClaimed(false);
        sessionStorage.removeItem('status');
    };

    // Close the popup modal
    const handlePopupClose = () => {
        setShowPayingSection(false);
        setShowProductHolding(false)
    };

    // Play the delete sound effect
    const playSound = () => {
        const audio = new Audio(delSound);
        audio.play().catch((error) => console.error('Audio play failed:', error));
    };


    // const calculateLoyaltyPoints = () => {
    //     const total = parseFloat(calculateTotalPrice()) || 0;
    //     const loyaltyPoints = total * 0.01;
    //     // Truncate to 2 decimal places without rounding
    //     const truncated = Math.trunc(loyaltyPoints * 100) / 100;
    //     return isNaN(truncated) ? 0 : truncated.toFixed(2);
    // };

    const calculateLoyaltyPoints = () => {
        const total = parseFloat(calculateTotalPrice()) || 0;
        const loyaltyPoints = total * 0.01;
        // Return with 2 decimal places
        return isNaN(loyaltyPoints) ? "0.00" : loyaltyPoints.toFixed(2);
    };

    const handleDiscountType = (e) => {
        setDiscountType(e.target.value)
    }
    useEffect(() => {
        if (discountType === 'fixed') {
            return setDiscountSymbole(currency);
        }
        if (discountType === 'percentage') {
            return setDiscountSymbole('%');
        }
    }, [discountType]);

    const handleDiscount = (e) => {
        if (!discountType) {
            alert('Please select a discount type first.');
            return;
        }
        const value = e.target.value;
        if (discountType === 'percentage') {
            const numericValue = parseFloat(value);
            if (numericValue < 1 || numericValue > 100) {
                alert('Please enter a percentage value between 1 and 100.');
                return;
            }
        }

        setDiscount(value);
    };

    const handleTax = (e) => {
        setTax(e.target.value)
    }
    const handleShippng = (e) => {
        setShipping(e.target.value)
    }

    useEffect(() => {
        if (useCreditPayment) {
            const total = parseFloat(calculateTotalPrice()) || 0;
            const rate = parseFloat(creditDetails.interestRate || 0);
            const months = parseFloat(creditDetails.months || 1);

            const interestAmount = ((total * rate) / 100).toFixed(2);
            const monthlyInstallment = ((+total + +interestAmount) / months).toFixed(2);

            setCreditDetails(prev => ({
                ...prev,
                interestAmount,
                monthlyInstallment
            }));
        } else {
            // Reset interest when credit is off
            setCreditDetails(prev => ({
                ...prev,
                interestAmount: '0',
                monthlyInstallment: '0'
            }));
        }
    }, [creditDetails.interestRate, creditDetails.months, useCreditPayment, productBillingHandling]);

    const gatherProductDetails = () => {
        return productBillingHandling
            .filter(product => product.ptype !== 'Base')
            .map(product => {

                const isVariation = product.ptype === 'Variation';
                const selectedVariation = product.selectedVariation;
                const variationData = isVariation ? product.variationValues?.[selectedVariation] || {} : {};

                const discount = isVariation ? variationData.discount || 0 : product.discount || 0;
                const tax = isVariation ? variationData.orderTax || 0 : product.tax || 0;
                const taxType = isVariation ? variationData.taxType || 'exclusive' : product.taxType || 'exclusive';

                const applicablePrice = getApplicablePrice(product);
                const subTotal = (((applicablePrice - discount) * product.qty) + ((applicablePrice - discount) * product.qty * (tax) / 100)).toFixed(2);

                let wholesaleEnabled = false;
                let wholesaleMinQty = 0;
                let wholesalePrice = 0;



                if (product.ptype === 'Variation') {
                    wholesaleEnabled = variationData.wholesaleEnabled || false;
                    wholesaleMinQty = variationData.wholesaleMinQty || 0;
                    wholesalePrice = variationData.wholesalePrice || 0;
                } else {
                    wholesaleEnabled = product.wholesaleEnabled || false;
                    wholesaleMinQty = product.wholesaleMinQty || 0;
                    wholesalePrice = product.wholesalePrice || 0;
                }

                 const productCost = isVariation
                ? variationData.productCost !== undefined
                    ? variationData.productCost
                    : product.productCost
                : product.productCost;

                return {
                    currentID: product.id,
                    name: product.name,
                    ptype: product.ptype,
                    specialDiscount: product.specialDiscount || 0,
                    warehouse: product.warehouse || {},
                    variation: product.selectedVariation ? product.selectedVariation : null,
                    qty: product.qty,
                    discount: discount,
                    taxType: taxType,
                    tax: tax,
                    price: product.price,
                    subTotal: subTotal,
                    wholesaleEnabled: wholesaleEnabled,
                    wholesaleMinQty: wholesaleMinQty,
                    wholesalePrice: wholesalePrice,
                    productCost: productCost
                };
            });
    };

    const handleHoldingProduct = async () => {
        if (!refferenceNumber || productDetailsForHolding.length === 0) {
            alert('Reference Number and products are required');
            return;
        }

        const dataToSend = {
            referenceNo: refferenceNumber,  // Use the generated reference number
            products: productDetailsForHolding
        };

        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/holdProducts`, dataToSend);

            if (response.status === 201) {
                console.log('Hold successful:', response.data);
                sessionStorage.setItem('heldProducts', JSON.stringify(productDetailsForHolding));

                handleBillReset();  // Reset billing after holding products
                setShowProductHolding(false);  // Close the popup
                setHeldProductReloading(true); // Trigger reloading of held products
            }
        } catch (error) {
            console.error('Error saving held products:', error);
        }
    };


    return (
        <div>
            <div className='flex justify-between'>
                <h2 className="text-lg font-semibold text-sm mb-4 text-gray-500"> {new Date().toLocaleDateString('en-GB')} - {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h2>
                <h2 className="text-lg font-semibold mb-4 text-gray-500">{selectedCustomerName}</h2>
            </div>

            <div style={{ minHeight: '260px' }}>
                <div className="overflow-y-auto scroll-container" style={{ maxHeight: '245px' }}>
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left text-gray-500 text-base">Product</th>
                                <th className="px-4 py-2 text-left text-gray-500 text-base">Quantity</th>
                                <th className="px-4 py-2 text-left text-gray-500 text-base">Price</th>
                                <th className="px-4 py-2 text-left text-gray-500 text-base">Sub</th>
                                <th className="px-2 py-2 text-left text-gray-500 text-base text-right">#</th>
                            </tr>
                        </thead>
                        {productBillingHandling.length === 0 ? (
                            <div className="text-center">
                                <p className="text-left pl-4">No products</p>
                            </div>
                        ) : (
                            <tbody>
                                {productBillingHandling.length === 0 ? (
                                    <tr>
                                        <td className="text-center" colSpan="5">
                                            No products selected yet.
                                        </td>
                                    </tr>
                                ) : (
                                    productBillingHandling.slice().reverse().map((product, displayIndex) => {
                                        // Calculate the original index based on the display index
                                        const originalIndex = productBillingHandling.length - 1 - displayIndex;
                                        return (
                                            <tr key={originalIndex} className="border-t">
                                                <td className="px-4 py-2 text-sm font-medium text-left">
                                                    {product.name}
                                                    {/* Show variation info if the product is a Variation type */}
                                                    {product.selectedVariation && (
                                                        <span className="text-gray-500 text-xs ml-1">
                                                            ({product.selectedVariation})
                                                        </span>
                                                    )}
                                                    {/* Edit Button */}
                                                    <button
                                                        //comment because skip login process before add discount
                                                        onClick={() => {
                                                            setSelectedProductIndex(originalIndex);
                                                            setSpecialDiscountPopUp(true);
                                                        }
                                                        }

                                                    //include login before add discount
                                                    /*onClick={() => {
                                                        //comment because skip login process before add discount
                                                        const status = sessionStorage.getItem('status');
                                                        if (status === 'success') { 
                                                        setSelectedProductIndex(originalIndex);
                                                        setSpecialDiscountPopUp(true);
                                                        }  else {
                                                            setSelectedProductIndex(originalIndex);
                                                            setOpenAuthModel(true);
                                                            setUsername('');
                                                            setPassword('');
                                                        } 
                                                    }
                                                }*/
                                                    >
                                                        <img
                                                            className="mt-[2px] ml-2 w-[15px] h-[15px]"
                                                            src="https://static-00.iconduck.com/assets.00/edit-icon-512x490-oaajgjo6.png"
                                                            alt="edit"
                                                        />
                                                    </button>
                                                </td>

                                                {/* Quantity Control Section */}
                                                <td className="px-4 py-2 text-sm flex items-center text-left">
                                                    {product.isService ? (
                                                        // For services, show fixed quantity without controls
                                                        <div className="flex items-center">
                                                            <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-600 text-center w-[60px]">
                                                                Service
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        // For regular products, show quantity controls
                                                        <>
                                                            <button
                                                                onClick={() => handleDecrement(originalIndex)}
                                                                className={`px-2 py-1 rounded-md bg-gray-200 text-gray-600`}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                className="w-[30px] text-center mx-2"
                                                                value={product.qty || 1}
                                                                onChange={(e) => handleQtyChange(e, originalIndex)}
                                                            />
                                                            <button
                                                                onClick={() => handleIncrement(originalIndex)}
                                                                className={`px-2 py-1 rounded-md bg-gray-200 text-gray-600`}
                                                            >
                                                                +
                                                            </button>
                                                        </>
                                                    )}
                                                </td>

                                                {/* Product Price */}
                                                <td className="px-4 py-2 text-sm text-gray-600 text-left">
                                                    {(() => {
                                                        const qty = product.qty || 0;
                                                        const isVariation = !!product.selectedVariation;
                                                        const variationData = isVariation ? product.variationValues?.[product.selectedVariation] : null;

                                                        const hasWholesale = isVariation
                                                            ? variationData?.wholesaleEnabled && qty >= variationData?.wholesaleMinQty
                                                            : product.wholesaleEnabled && qty >= product.wholesaleMinQty;

                                                        const originalPrice = isVariation
                                                            ? parseFloat(variationData?.productPrice || product.price || 0)
                                                            : parseFloat(product.productPrice || product.price || 0);

                                                        const wholesalePrice = getApplicablePrice(product);

                                                        return (
                                                            <div className="flex flex-col">
                                                                {hasWholesale && originalPrice > wholesalePrice && (
                                                                    <span className="text-[11px] h-[12px] text-red-500 line-through">
                                                                        {formatWithCustomCommas(originalPrice)}
                                                                    </span>
                                                                )}
                                                                <span>
                                                                    {formatWithCustomCommas(wholesalePrice)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>


                                                {/* Total Price = price * qty */}
                                                <td className="px-4 py-2 text-sm text-gray-600 text-left">
                                                    {formatWithCustomCommas(getRowSubtotal(product))}
                                                </td>

                                                {/* Delete Button */}
                                                <td className="px-2 py-2 text-sm text-gray-600">
                                                    <button
                                                        onClick={() => {
                                                            playSound();
                                                            handleDelete(originalIndex);
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        )}
                    </table>
                </div>
            </div >

            <div className="mt-0">
                <div className="px-4 py-2 text-left text-gray-500 text-base text-xl text-right">
                    <h1>Total Items: {totalItems}</h1>
                </div>
                <div className="px-4 py-2 text-left text-gray-800 text-base text-right">
                    <h1 className="text-3xl">Total : {currency}  {formatWithCustomCommas(calculateTotalPrice())}</h1>
                </div>
            </div>

            {/* Container for Discount, Shipping, and Tax Inputs */}
            <div className='fixed w-full justify-between mt-0 relative bottom-0 w-[32.5%]'>

                <div className="flex gap-2 px-[9px] justify-between py-1 mb-1 w-[100%]">
                    {/* Loyalty Points (1%) */}
                    <div className="flex flex-col md:w-1/2 w-full">
                        <label className="text-gray-700 text-sm font-medium mb-1">
                            Loyalty Points (1%)
                        </label>
                        <input
                            type="text"
                            value={calculateLoyaltyPoints()}
                            readOnly
                            className="w-full bg-gray-100 rounded-md border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:ring-gray-400 focus:border-gray-400 sm:text-sm"
                        />
                        <span className="text-xs text-gray-500 mt-1">
                            Redeemed Points: {calculateLoyaltyPoints()}
                        </span>
                    </div>
                    {/* Total Points */}
                    <div className="flex flex-col md:w-1/2 w-full">
                        <label className="text-gray-700 text-sm font-medium mb-1">
                            Total Points
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={isPointsClaimed ?
                                    `${(parseFloat(selectedCustomerData?.redeemedPoints || 0) - parseFloat(claimedPoints || 0)).toFixed(2)}` :
                                    (parseFloat(selectedCustomerData?.redeemedPoints || 0)).toFixed(2)}
                                readOnly
                                className={`w-full ${isPointsClaimed ? 'bg-green-50' : 'bg-gray-100'} rounded-md border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:ring-gray-400 focus:border-gray-400 sm:text-sm`}
                            />
                            {selectedCustomerData?.redeemedPoints > 0 && !isPointsClaimed && (
                                <button
                                    onClick={handleClaimPoints}
                                    className="absolute right-2 top-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                >
                                    Claim
                                </button>
                            )}
                            {isPointsClaimed && (
                                <span className="absolute right-2 top-2 text-xs text-green-600">
                                    ✓ Claimed
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                            {isPointsClaimed ?
                                `${parseFloat(claimedPoints || 0).toFixed(2)} points deducted from total` :
                                'Customer\'s total loyalty points'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2 px-[9px] justify-between py-1 mb-2 w-[100%]">
                    {permissionData.assign_offer && (
                        <div className="flex md:w-1/2 gap-2 w-full">
                            <select
                                onChange={handleDiscountType}
                                className="w-full bg-white bg-opacity-[1%] rounded-md border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:ring-gray-400 focus:border-gray-400 sm:text-sm"
                            >
                                <option value=''>Discount type</option>
                                <option value='fixed'>Fixed</option>
                                <option value='percentage'>Percentage</option>
                            </select>
                        </div>
                    )}
                    {permissionData.assign_offer && (
                        <div className="flex md:w-1/2 w-full">
                            <div className="relative w-full">
                                <input
                                    onChange={handleDiscount}
                                    value={discount}
                                    type="text"
                                    placeholder="Discount"
                                    className="w-full bg-white bg-opacity-[1%] rounded-md border border-gray-300 py-2 px-2 pr-10 text-gray-900 shadow-sm focus:ring-gray-400 focus:border-gray-400 sm:text-sm"
                                />
                                <span className="absolute inset-y-0 right-3 flex items-center text-gray-500">
                                    {discountSymbole}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className='flex w-full gap-2 px-1.5 py-1 mt-0'>
                    {permissionData.assign_offer && (
                        <div className="flex gap-4 w-[100%]'">
                            <button
                                onClick={(e) => setOpenOffersModel(true)}
                                className={`flex w-[160px] items-center text-white px-4 py-2 rounded-md hover:opacity-90 ${selectedOffer ? 'bg-red-600' : 'bg-[#35AF87]'
                                    }`}
                            >
                                <img className='w-5 h-5 mr-2' src={GiftIcon} alt='GiftIcon' />
                                Add Offers
                            </button>
                        </div>
                    )}
                    <div className="relative w-[32%]">
                        <input
                            onChange={handleTax}
                            value={tax}
                            type="text"
                            placeholder="Tax"
                            className="w-full bg-white bg-opacity-[1%] rounded-md border border-gray-300 py-2 px-3 pr-10 text-gray-900 shadow-sm focus:ring-gray-400 focus:border-gray-400 sm:text-sm"
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                            %
                        </span>
                    </div>

                    <div className="relative w-[36%]">
                        <input
                            onChange={handleShippng}
                            value={shipping}
                            type="text"
                            placeholder="Shipping"
                            className="w-full bg-white bg-opacity-[1%] rounded-md border border-gray-300 py-2 px-3 pr-10 text-gray-900 shadow-sm focus:ring-gray-400 focus:border-gray-400 sm:text-sm"
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                            {currency}
                        </span>
                    </div>
                </div>

                {specialDiscountPopUp && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center backdrop-blur-xs z-[1000]">
                        <div className="bg-white w-[350px] sm:w-[460px] p-6 rounded-2xl shadow-2xl">
                            <h2 className="text-xl font-semibold text-gray-700 text-center mb-6">
                                Add Discount
                            </h2>
                            <div className="relative mb-4">
                                <label className="block text-left text-sm font-medium text-gray-700">Discount Type :</label>
                                <select
                                    value={specialDiscountType}
                                    onChange={handleSpecialDiscountTypeChange}
                                    className="w-full border border-gray-300 p-3 pl-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87] mb-2"
                                    required
                                >
                                    <option value="">Select Discount Type</option>
                                    <option value="fixed">Fixed</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                                <label className="block text-left text-sm font-medium text-gray-700">Discount Amount :</label>
                                <input
                                    type="number"
                                    placeholder={specialDiscountType === 'percentage' ? 'Discount (%)' : 'Discount'}
                                    value={specialDiscountInput}
                                    onChange={handleSpecialDiscountInputChange}
                                    ref={discountInputRef}
                                    className="w-full border border-gray-300 p-3 pl-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                    required
                                    disabled={!specialDiscountType}
                                />
                                {specialDiscountType === 'percentage' && (
                                    <p className="text-xs text-gray-500 mt-1">Calculated Discount: {specialDiscount}</p>
                                )}
                            </div>
                            <div className="flex justify-between">
                                <button
                                    onClick={handleAddSpecialDiscount}
                                    className="submit w-1/2 mr-2 text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSpecialDiscountPopUp(false)}
                                    className="bg-gray-500 w-1/2 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/*                 {openAuthModel && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center backdrop-blur-xs z-[1000]">
                        <div className="bg-white w-[350px] sm:w-[460px] p-6 rounded-2xl shadow-2xl">
                            <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">
                                Get access for discount
                            </h2>
                            <label className="block text-left text-sm font-medium text-gray-700">Username</label>
                            <div className="relative mb-4">
                                <input
                                    type="email"
                                    placeholder="hello@gmail.com"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full border border-gray-300 p-3 pl-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                    required
                                />
                            </div>

                            <label className="block text-left text-sm font-medium text-gray-700">Admin Password</label>
                            <div className="relative mb-4">
                                <input
                                    type="password"
                                    placeholder="x x x x x x x"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border border-gray-300 p-3 pl-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                    required
                                    autoComplete="new-password"
                                    name={`password-${Math.random()}`}
                                />
                            </div>
                            <div className="flex justify-between">
                                <button
                                    onClick={handleDiscountAccess}
                                    className="submit w-1/2 mr-2 text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    logging
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpenAuthModel(false)}
                                    className="bg-gray-500 w-1/2 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )} */}

                {openOffersModel && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center backdrop-blur-xs z-[1000]">
                        <div className="bg-white w-[350px] sm:w-[460px] p-6 rounded-2xl shadow-2xl">
                            <button
                                onClick={(e) => setOpenOffersModel(false)}
                                className="flex justify-last bold text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                            <h2 className="text-xl font-semibold text-gray-700 text-center mb-4">
                                Select the Offer
                            </h2>
                            <div className="relative mb-4">
                                <label className="block text-left text-sm font-medium text-gray-700">Offer: </label>
                                <select
                                    value={selectedOffer}
                                    onChange={handleOfferChange}
                                    className="w-full border border-gray-300 p-3 pl-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                                >
                                    <option value="">Select the Offer</option>
                                    {offersData.map((offer, index) => (
                                        <option key={index} value={offer.id}>
                                            {offer.offerName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Buttons Section */}
                <div className="flex gap-2 px-1.5 py-1 mt-0 w-[100%]">
                    <button
                        onClick={handleBillReset}
                        className="button-dark-color w-[32%] rounded-md px-4 py-3 text-white font-semibold text-sm shadow-md focus:outline-none"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => {
                            const ProductHoldList = gatherProductDetails();
                            if (ProductHoldList.length > 0) {
                                setShowProductHolding(true);
                                setProductDetailsForHolding(ProductHoldList);
                                sessionStorage.removeItem('status');
                            } else {
                                alert('No product data available');
                            }
                        }}
                        className="button-dark-color w-[32%] rounded-md px-4 py-3 text-white font-semibold text-sm shadow-md focus:outline-none"
                    >
                        Hold
                    </button>
                    <button
                        onClick={() => {
                            setShowPayingSection(true);
                            setResponseMessage('')
                            const productDetails = gatherProductDetails();
                            setProductDetailsForPrinting(productDetails);
                            sessionStorage.removeItem('status');
                        }}
                        className="button-bg-color  w-[32%] rounded-md px-4 py-3 text-white font-semibold text-sm shadow-md focus:outline-none"
                    >
                        Pay Now
                    </button>
                </div>
            </div>

            {/* PAYING SECTION */}
            <div>
                {showPayingSec && (
                    <PayingSection
                        handlePopupClose={handlePopupClose}
                        totalItems={totalItems}
                        totalPcs={totalPcs}
                        profit={profit}
                        tax={tax}
                        shipping={shipping}
                        discount={discount}
                        discountValue={calculateDiscountAmount(calculateBaseTotal())}
                        productDetails={productDetailsForPrinting}
                        baseTotal={calculateBaseTotal()}
                        handleBillReset={handleBillReset}
                        setSelectedCategoryProducts={setSelectedCategoryProducts}
                        setSelectedBrandProducts={setSelectedBrandProducts}
                        setSearchedProductData={setSearchedProductData}
                        setProductData={setProductData}
                        selectedCustomer={selectedCustomer || 'Unknown'}
                        selectedCustomerName={selectedCustomerName}
                        discountType={discountType}
                        warehouse={warehouse}
                        responseMessage={responseMessage}
                        setResponseMessage={setResponseMessage}
                        setReloadStatus={setReloadStatus}
                        offerPercentage={offerPercentage}
                        calculateTotalPrice={calculateTotalPrice}
                        setError={setError}
                        setProgress={setProgress}
                        setSelectedOffer={setSelectedOffer}
                        useCreditPayment={useCreditPayment}
                        setUseCreditPayment={setUseCreditPayment}
                        creditDetails={creditDetails}
                        setCreditDetails={setCreditDetails}
                        claimedPoints={claimedPoints}
                        isPointsClaimed={isPointsClaimed}
                        redeemedPointsFromSale={calculateLoyaltyPoints()}
                        logPoints={() => {
                            console.log('[posBillCalculation] Passing to PayingSection - claimedPoints:', claimedPoints,
                                'isPointsClaimed:', isPointsClaimed);
                        }}
                        setFetchRegData={setFetchRegData}
                    />
                )}
            </div>

            {/*PRODUCT HOLDING POP UP*/}
            <div>
                {showProductHolding && productDetailsForHolding && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white w-[600px] h-[700px] p-6 rounded-md shadow-lg z-50">
                            <h1 className='className="text-lg font-semibold'>Hold this product in the list</h1>
                            <div className='mt-5'>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Add a Refference number</label>
                                <input
                                    value={refferenceNumber}
                                    type="text"
                                    readOnly
                                    placeholder="Reference number"
                                    className="block w-full mb-10 mt-2 rounded-md border-0 py-2.5 px-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                                />

                            </div>
                            <table className="w-full table-auto border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100 border-b">
                                        <th className="px-4 py-2 border text-left">Product Name</th>
                                        <th className="px-4 py-2 border text-left">Quantity</th>
                                        <th className="px-4 py-2 border text-left">Price</th>
                                        <th className="px-4 py-2 border text-left">Sub Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productDetailsForHolding.map((product, index) => {
                                        const price = parseFloat(product.price) || 0;
                                        const qty = parseInt(product.qty, 10) || 0;
                                        return (
                                            <tr key={index} className="border-b">
                                                <td className="px-4 py-2 border text-left">{product.name}</td>
                                                <td className="px-4 py-2 border text-left">{qty}</td>
                                                <td className="px-4 py-2 border text-left">{currency} {formatWithCustomCommas(getApplicablePrice(product))}</td>
                                                <td className="px-4 py-2 border text-left">{currency} {formatWithCustomCommas(getRowSubtotal(product))}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className='flex  mt-5'>
                                <button
                                    className="px-4 py-2  bg-gray-500 text-white rounded-md"
                                    onClick={handlePopupClose}
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleHoldingProduct}
                                    className="submit ml-2 rounded-md px-2 py-2 h-[41px] text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-[140px] text-center"
                                >
                                    Hold
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
export default BillingSection;