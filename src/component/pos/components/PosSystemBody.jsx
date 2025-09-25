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

  import { useState, useEffect, useRef, useContext, useCallback } from "react";
  import ProductFilters from "./ProductFilters";
  import CryptoJS from "crypto-js";
  import { useCurrency } from "../../../context/CurrencyContext";
  import { Link } from "react-router-dom";
  import "../../../styles/role.css";
  import "react-loading-skeleton/dist/skeleton.css";
  import "../../../styles/tempory.css";
  import "../utils/fetchDefaultData";
  import formatWithCustomCommas from "../../utill/NumberFormate";
  import Menu from "../../../img/held POS 1.png";
  import pro from "../../../img/Main Close POS 1.png";
  import Full from "../../../img/Full Screen POS 1.png";
  import Cal from "../../../img/Cal POS 1.png";
  import Back from "../../../img/Back POS 1.png";
  import SL_R from "../../../img/saleReturn.png";
  import User from "../../../img/add-user (1).png";
  import Box from "@mui/material/Box";
  import Skeleton from "react-loading-skeleton";
  import BillingSection from "./posBillCalculation";
  import popSound from "../../../../src/audio/b.mp3";
  import axios from "axios";
  import LinearProgress from "@mui/material/LinearProgress";
  import Calculator from "./posCalCulator";
  import ProductVariationModal from "./productVariationEdit";
  import { handleProductSubmit } from "../utils/searchProduct";
  import {
    getHeldProducts,
    handleDeleteHoldProduct,
  } from "../utils/holdProductControll";
  import { fetchCategoryData } from "../utils/fetchByCategory";
  import { fetchBrandData } from "../utils/fetchByBrand";
  import { fetchAllData } from "../utils/fetchAllData";
  import { handleFullScreen } from "../utils/fullScreenView";
  import { handlePopupOpen } from "../utils/registerHandling";
  import { fetchProductDataByWarehouse } from "../utils/fetchByWarehose";
  import {
    getPriceRange,
    getQty,
    getTax,
    getDiscount,
    getProductCost,
  } from "../utils/qtyAndPriceCalculation";
  import { useNavigate } from "react-router-dom";
  import { toast } from "react-toastify";
  import { UserContext } from "../../../context/UserContext";
  import Draggable from "react-draggable"; 
  import { determineSearchTypeOfService } from "../utils/searchService";
  import { handleServiceSubmit, debouncedServiceSearch } from "../utils/searchService";
  import ServicesPopupModal from './ServicesPopupModal';



  function PosSystemBody({ defaultWarehouse }) {
    const ProductIcon =
      "https://cdn0.iconfinder.com/data/icons/creative-concept-1/128/PACKAGING_DESIGN-512.png";
    const { userData } = useContext(UserContext);
    const [filters, setFilters] = useState({
      brands: [],
      warehouses: [],
      categories: [],
    });
    const [warehouse, setWarehouse] = useState(
      sessionStorage.getItem("defaultWarehouse") || ""
    );
    const [productData, setProductData] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [searchCustomerResults, setSearchCustomerResults] = useState([]);
    const [searchedProductData, setSearchedProductData] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [Productkeyword, setProductKeyword] = useState("");
    const [selectedBrandProducts, setSelectedBrandProducts] = useState([]);
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(false);
    const [loadingCir, setLoadingCir] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [productBillingHandling, setProductBillingHandling] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectVariation, setSelectVariation] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [isHoldList, setIsHoldList] = useState(false);
    const [heldProducts, setHeldProducts] = useState([]);
    const [isExitingPopupOpen, setIsExitingPopupOpen] = useState(false);
    const [isPopUpRegisterReport, setIsPopUpRegisterReport] = useState(false);
    const [selectedCustomerData, setSelectedCustomerData] = useState(null);
    const [registerData, setRegisterData] = useState({
      openTime: "",
      username: "",
      name: "",
      cashHandIn: 0,
      totalBalance: 0,
    });
    const [totalBalance, setTotalAmount] = useState(0);
    const [openTime, setOpenTime] = useState("");
    const cashierUsername = sessionStorage.getItem("cashierUsername");
    const [cashierName, setCashierName] = useState("Unknown Cashier");
    const [cashierTotalSale, setCashierTotalSale] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const [error, setError] = useState("");
    const [reloadStatus, setReloadStatus] = useState(false);
    const [heldProductReloading, setHeldProductReloading] = useState(false);
    const inputRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [walkInCustomerName, setWalkInCustomerName] = useState("");
    const [walkInCustomerNic, setWalkInCustomerNic] = useState("");
    const [walkInCustomerMobile, setWalkInCustomerMobile] = useState("");
    const [walkInCustomerLoyaltyRef, setWalkInCustomerLoyaltyRef] = useState("");
    const [walkInCustomerRedeemedPoints, setWalkInCustomerRedeemedPoints] =
      useState("");
    const [customerSearchError, setCustomerSearchError] = useState("");
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [permissionData, setPermissionData] = useState([]);
    const cashRegisterID = sessionStorage.getItem("cashRegisterID");
    const [cardPaymentAmount, setCardPaymentAmount] = useState(0);
    const [cashPaymentAmount, setCashPaymentAmount] = useState(0);
    const [bankTransferPaymentAmount, setBankTransferPaymentAmount] = useState(0);
    const [totalSaleAmount, setTotalSale] = useState(0);
    const [cashHandIn, setCashHandIn] = useState(0);
    const [totalDiscountAmount, setTotalDiscountAmount] = useState(0);
    const [inputs, setInputs] = useState({
      amount20: 0,
      amount50: 0,
      amount100: 0,
      amount500: 0,
      amount1000: 0,
      amount5000: 0,
      amount1: 0,
      amount2: 0,
      amount5: 0,
      amount10: 0,
    });
    const [ProductNameOrCode, setProductNameOrCode] = useState("");
    const [regDataFetching, setFetchRegData] = useState(false);
    const [refreshKey, setRefreshKey] = useState(Date.now());
    const startLoading = () => setLoadingCir(true);
    const stopLoading = () => setLoadingCir(false);
    const notFoundToastShown = useRef(false);
    const [searchedProductDataByName, setSearchedProductDataByName] = useState(
      []
    );
    const selectedWarehouseAccess =
      permissionData?.warehousePermissions?.[warehouse]?.access ?? false;
    const { currency } = useCurrency();
    const [selectedCustomerName, setSelectedCustomerName] = useState("");
    const [showBrandPopup, setShowBrandPopup] = useState(false);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [showServicesData, setShowServicesData] = useState(false);
    const [showCategoryPopup, setShowCategoryPopup] = useState(false);
    const [serviceKeyword, setServiceKeyword] = useState("");
    const [searchedServiceData, setSearchedServiceData] = useState([]);
    const [isServicesPopupOpen, setIsServicesPopupOpen] = useState(false);

    //COMBINE ALL DATA FETCHING TYPE INTO ONE STATE
const combinedProductData =
  showServicesData && serviceKeyword.trim() !== ""
    ? searchedServiceData
    : showServicesData
    ? services
    : searchedProductDataByName.length > 0
    ? searchedProductDataByName
    : searchedProductData.length > 0
    ? searchedProductData
    : selectedCategoryProducts.length > 0
    ? selectedCategoryProducts
    : selectedBrandProducts.length > 0
    ? selectedBrandProducts
    : productData.length > 0
    ? productData
    : [];

    // Debug combined data
    useEffect(() => {
      console.log('State Debug:', {
        showServicesData,
        servicesLength: services.length,
        combinedDataLength: combinedProductData.length,
        combinedDataType: showServicesData ? 'services' : 'products',
        selectedWarehouseAccess,
        warehouse
      });
    }, [showServicesData, services, combinedProductData, selectedWarehouseAccess, warehouse]);

    // Debug services state changes
    useEffect(() => {
      console.log('Services state changed:', services);
    }, [services]);

    const navigate = useNavigate();

    useEffect(() => {
      if (userData) {
        const permissions = userData?.permissions || {};
        const warehousePermissions = Object.values(
          permissions?.managePOS?.warehouses || {}
        ).reduce((acc, warehouse) => {
          if (warehouse.warehouseName) {
            acc[warehouse.warehouseName] = warehouse;
          }
          return acc;
        }, {});

        // Function to check if the user has any permission on a specific key
        const hasAnyPermission = (permissionKey) => {
          const subPermissions = permissions[permissionKey] || {};
          return Object.values(subPermissions).some(Boolean);
        };

        setPermissionData({
          ...Object.keys(permissions).reduce((acc, key) => {
            acc[key] = hasAnyPermission(key);
            return acc;
          }, {}),
          warehousePermissions,
        });
      }
    }, [userData]);

    useEffect(() => {
      if (reloadStatus && !warehouse) {
        fetchAllData(
          setProductData,
          setSelectedCategoryProducts,
          setSelectedBrandProducts,
          setSearchedProductData,
          setProgress,
          setError
        );
        setReloadStatus(false);
      }
    }, [reloadStatus]);

    const refreshAllReports = useCallback(() => {
      setRefreshKey(Date.now());
    }, []);



    
    useEffect(() => {
      if (!warehouse) {
        fetchAllData(
          setProductData,
          setSelectedCategoryProducts,
          setSelectedBrandProducts,
          setSearchedProductData,
          setProgress,
          setError
        );
      }
    }, [warehouse]);

    const handleWarehouseChange = (e) => {
      const selectedWarehouse = e.target.value;
      setWarehouse(selectedWarehouse);

      // Ensure selectedWarehouse matches the format of the keys in warehousePermissions
      const warehousePerms =
        permissionData?.warehousePermissions?.[selectedWarehouse] || {};
      if (selectedWarehouse) {
        fetchProductDataByWarehouse(
          selectedWarehouse,
          setProductData,
          setSelectedCategoryProducts,
          setSelectedBrandProducts,
          setSearchedProductData,
          setLoading
        );
      } else {
        setProductData([]);
      }
    };

    useEffect(() => {
      if (productData.length > 0) {
      }
    }, [productData]);

    const canSelectProduct = (productWarehouseName) => {
      if (!productWarehouseName) {
        return false;
      }
      // Ensure that we're checking permissions for the selected warehouse, not the product's warehouse
      const warehouseEntry =
        permissionData?.warehousePermissions?.[warehouse] || {}; // Use 'warehouse' state here

      if (!warehouseEntry) {
        return false;
      }

      // Check if the user has `access` and `create_pos_sale` permissions
      const isSelectable = !!(
        warehouseEntry.access && warehouseEntry.create_sale_from_pos
      );

      if (isSelectable) {
      } else {
      }

      return isSelectable;
    };

    const playSound = () => {
      const audio = new Audio(popSound);
      audio.play().catch((error) => {
        console.error("Audio play failed:", error);
      });
    };

    useEffect(() => {
      console.log("productBillingHandling updated:", productBillingHandling);
    }, [productBillingHandling]);

    const toggleCalculator = () => {
      setShowCalculator((prevState) => {
        return !prevState;
      });
    };

    useEffect(() => {
      const savedWarehouse = sessionStorage.getItem("defaultWarehouse");
      if (savedWarehouse) {
        setWarehouse(savedWarehouse);
        fetchProductDataByWarehouse(
          savedWarehouse,
          setProductData,
          setSelectedCategoryProducts,
          setSelectedBrandProducts,
          setSearchedProductData,
          setLoading
        );
      }
    }, []);

    useEffect(() => {
      getHeldProducts(setHeldProducts);
      setHeldProductReloading(false);
    }, [heldProductReloading]);

    useEffect(() => {
      if (searchedProductData.length > 0) {
        searchedProductData.forEach((product) => {
          if (!product.warehouse || Object.keys(product.warehouse).length === 0) {
            console.error("Product is missing warehouse data:", product);
            alert("This product is missing warehouse data and cannot be added.");
            return;
          }

          handleAddingProduct({
            id: product._id,
            name: product.name,
            price: getPriceRange(product),
            productCost: getProductCost(product),
            stokeQty: product.productQty || getQty(product),
            taxType: product.taxType || "exclusive",
            tax: product.oderTax ? product.oderTax : getTax(product),
            discount: getDiscount(product),
            ptype: product.ptype,
            warehouse: product.warehouse,
            variation: product.variation,
            variationType: product.variationType,
            variationValues: product.variationValues,
            wholesaleEnabled:
              product.warehouse?.[warehouse]?.wholesaleEnabled || false,
            wholesaleMinQty: product.warehouse?.[warehouse]?.wholesaleMinQty || 0,
            wholesalePrice: product.warehouse?.[warehouse]?.wholesalePrice || 0,
          });
        });
      }
    }, [searchedProductData]);

  const handleAddingProduct = (product) => {
    console.log("=== handleAddingProduct Debug ===");
    console.log("Full product object received:", product);
    console.log("Product isService property:", product.isService);
    console.log("Product ID:", product.id);
    console.log("Product name:", product.name);
    console.log("Product price:", product.price);
    console.log("================================");
    
    setProductBillingHandling((prevBilling) => {
      // Special handling for services
      if (product.isService) {
        console.log("🔧 PROCESSING SERVICE:", product.name);
        console.log("Service price received:", product.price);
        
        const existingService = prevBilling.find(
          (p) => p.id === product.id
        );

        if (existingService) {
          console.log("⚠️ Service already exists - services should not have quantity incremented");
          toast.info("Service is already added to the bill");
          return prevBilling; // Don't increment quantity for services
        } else {
          // For services, use the calculated final price
          const servicePrice = product.price || 0;
          
          const serviceForBilling = { 
            ...product, 
            qty: 1, // Services always have quantity of 1
            stokeQty: 999999,
            isService: true,
            ptype: 'Service', // Add this for backend compatibility
            currentID: product.id,
            productQty: 999999,
            price: servicePrice, // Use the final calculated price
            // Store original values for reference
            originalPrice: product.originalPrice || servicePrice,
            originalTax: product.originalTax || 0,
            originalDiscount: product.originalDiscount || 0,
            // Tax and discount are already applied in the price, so set them to 0 for billing
            tax: 0,
            discount: 0,
            taxType: product.taxType || 'exclusive'
          };
          
          console.log("✅ Adding new service to billing:", serviceForBilling);
          return [...prevBilling, serviceForBilling];
        }
      }
        // Regular product handling
        const selectedWarehouse =
          warehouse || sessionStorage.getItem("defaultWarehouse");
        const defaultWarehouse = sessionStorage.getItem("defaultWarehouse");

        if (!selectedWarehouse) {
          alert("No warehouse selected.");
          return prevBilling;
        }

        if (selectedWarehouse !== defaultWarehouse) {
          alert("You can only add products from the default warehouse.");
          return prevBilling;
        }

        if (!product.warehouse || Object.keys(product.warehouse).length === 0) {
          alert("Product data is missing warehouse details.");
          return prevBilling;
        }

        const warehouseKey = Object.keys(product.warehouse || {}).find(
          (key) => key.toLowerCase() === selectedWarehouse.toLowerCase()
        );

        if (!warehouseKey) {
          alert(
            `Warehouse '${selectedWarehouse}' does not exist for this product.`
          );
          return prevBilling;
        }

        const warehouseData = product.warehouse[warehouseKey];

        if (!warehouseData) {
          alert(`No data found for warehouse '${warehouseKey}'.`);
          return prevBilling;
        }

        // Extract warehouse-specific data including taxType
        const productWithWarehouseData = {
          id: product.id,
          name: product.name,
          price: getPriceRange(product),
          productCost: getProductCost(product),
          stokeQty: warehouseData.productQty || 0,
          tax: warehouseData.orderTax || 0, // Use warehouse orderTax
          taxType: warehouseData.taxType || "exclusive", // Extract taxType from warehouse
          discount: warehouseData.discount || 0, // Use warehouse discount
          ptype: product.ptype,
          warranty: product.warranty,
          warehouse: selectedWarehouse,
          variation: product.variation,
          variationType: product.variationType || "Unknown",
          variationValues: warehouseData.variationValues || {},
          wholesaleEnabled: warehouseData.wholesaleEnabled || false,
          wholesaleMinQty: warehouseData.wholesaleMinQty || 0,
          wholesalePrice: warehouseData.wholesalePrice || 0,
        };

        if (product.ptype === "Single") {
          const existingProduct = prevBilling.find(
            (p) => p.id === product.id && p.warehouse === selectedWarehouse
          );

          if (existingProduct) {
            if (existingProduct.qty + 1 > warehouseData.productQty) {
              console.warn("[WARNING] Cannot add more than available stock.");
              alert("Cannot add more than available stock.");
              return prevBilling;
            } else {
              return prevBilling.map((p) =>
                p.id === product.id && p.warehouse === selectedWarehouse
                  ? { ...p, qty: p.qty + 1 }
                  : p
              );
            }
          } else {
            if (warehouseData.productQty > 0) {
              return [...prevBilling, { ...productWithWarehouseData, qty: 1 }];
            } else {
              console.error("[ERROR] Product is out of stock.");
              alert("This product is out of stock.");
              return prevBilling;
            }
          }
        } else if (product.ptype === "Variation") {
          const existingVariation = prevBilling.find(
            (p) =>
              p.id === product.id &&
              p.selectedVariation === product.selectedVariation
          );

          if (existingVariation) {
            alert("This variation is already added from held products.");
            return prevBilling;
          }

          const variationValues = warehouseData.variationValues || {};
          if (!Object.keys(variationValues).length) {
            alert(
              "No variations found for this product in the selected warehouse."
            );
            return prevBilling;
          }

          setSelectVariation(true);
          setSelectedProduct({
            ...productWithWarehouseData,
            variationValues,
          });
          return prevBilling;
        }
        return prevBilling;
      });

      setTimeout(() => {
        fetchAllData(
          setProductData,
          setSelectedCategoryProducts,
          setSelectedBrandProducts,
          setSearchedProductData,
          setProgress,
          setError
        );
        setProductKeyword("");
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
      inputRef.current.focus();
    };

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, [Productkeyword]);

    const getQtyForSelectedWarehouse = (product, selectedWarehouse) => {
      if (
        product.warehouse &&
        typeof product.warehouse === "object" &&
        selectedWarehouse
      ) {
        // Get the specific warehouse data for the selected warehouse
        const selectedWarehouseData = product.warehouse[selectedWarehouse];

        if (selectedWarehouseData) {
          // If the warehouse has variations, calculate the quantity for each variation
          if (selectedWarehouseData.variationValues) {
            const quantities = Object.values(
              selectedWarehouseData.variationValues
            )
              .map((variation) => {
                const qty = Number(variation.productQty);
                return qty;
              })
              .filter((qty) => !isNaN(qty));
            return quantities.length > 0
              ? quantities.reduce((total, current) => total + current, 0)
              : 0;
          } else {
            return Number(selectedWarehouseData.productQty) || 0;
          }
        } else {
          console.log("No data found for selected warehouse");
        }
      } else {
        console.log("Invalid warehouse or product data");
      }

      // Return 0 if no warehouse data is found for the selected warehouse or if selectedWarehouse is invalid
      return 0;
    };

    const handleHoldOpen = () => {
      setIsHoldList(!isHoldList);
    };

    const handleFindUser = async (e) => {
      const value = e.target.value;
      setKeyword(value);

      if (value.trim() === "") {
        setSearchCustomerResults([]);
        setCustomerSearchError("");
        notFoundToastShown.current = false;
        return;
      }

      setCustomerSearchError("");

      try {
        const searchType = determineSearchType(value);
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/api/fetchCustomer`,
          {
            params: { keyword: value, searchType },
          }
        );

        let customers = response.data.customers || [];

        // Handle search filtering
        if (searchType === "name" && keyword.trim()) {
          if (keyword.trim().length === 1) {
            customers = customers.filter(
              (c) =>
                c.name && c.name.toLowerCase() === keyword.trim().toLowerCase()
            );
          } else {
            customers = customers.filter(
              (c) =>
                c.name &&
                c.name.toLowerCase().includes(keyword.trim().toLowerCase())
            );
          }
        } else if (searchType === "loyaltyReferenceNumber" && keyword.trim()) {
          customers = customers.filter(
            (c) =>
              c.loyaltyReferenceNumber &&
              c.loyaltyReferenceNumber.toString().includes(keyword.trim())
          );
        }

        setSearchCustomerResults(customers);

        // Show error toast if nothing found
        if (customers.length === 0 && keyword.trim().length > 1) {
          toast.error(`Customer not found for "${keyword}"`, { autoClose: 2000 });
        }
      } catch (error) {
        if (!notFoundToastShown.current) {
          toast.error(error.response?.data?.message || "Customer not found", {
            autoClose: 2000,
          });
          setCustomerSearchError(
            error.response?.data?.message || "Customer not found"
          );
          notFoundToastShown.current = true;
        }
        setSearchCustomerResults([]);
      }
    };

    const determineSearchType = (keyword) => {
      if (/^\d+$/.test(keyword)) {
        // If numeric, decide whether it's mobile or loyaltyReferenceNumber
        // For example, mobiles are usually 10 digits
        return keyword.length === 10 ? "mobile" : "loyaltyReferenceNumber";
      } else if (
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(keyword)
      ) {
        return "username"; // email
      } else {
        return "name";
      }
    };

    const handleWalkInCustomerSubmit = async (e) => {
      e.preventDefault();

      // Input validation
      if (!walkInCustomerName.trim()) {
        toast.error("Customer name is required.", { autoClose: 2000 });
        return;
      }
      const newNICRegex = /^\d{12}$/; // New format: 12 digits only
      const oldNICRegex = /^\d{9}[VXvx]$/; // Old format: 9 digits + 'V' or 'X'

      if (
        !newNICRegex.test(walkInCustomerNic) &&
        !oldNICRegex.test(walkInCustomerNic)
      ) {
        toast.error(
          'NIC must be either 12 digits (new format) or 9 digits followed by "V" or "X" (old format).',
          { autoClose: 2000 }
        );
        return;
      }
      if (
        !walkInCustomerMobile.trim() ||
        !/^0\d{9}$/.test(walkInCustomerMobile)
      ) {
        toast.error(
          'Mobile is required and must start with "0" and contain exactly 10 digits.',
          { autoClose: 2000 }
        );
        return;
      }

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_BASE_URL}/api/walkInCustomer`,
          {
            name: walkInCustomerName.trim(),
            nic: walkInCustomerNic.trim(),
            mobile: walkInCustomerMobile.trim(),
            loyaltyReferenceNumber: walkInCustomerLoyaltyRef?.trim() || "", // Add loyalty reference if you have this field
            redeemedPoints: walkInCustomerRedeemedPoints
              ? Number(walkInCustomerRedeemedPoints)
              : 0, // Add redeemed points if you have this field
          }
        );

        toast.success(response.data.message || "Customer created successfully!", {
          autoClose: 2000,
          className: "custom-toast",
        });
        setWalkInCustomerName("");
        setWalkInCustomerNic("");
        setWalkInCustomerMobile("");
        setWalkInCustomerLoyaltyRef && setWalkInCustomerLoyaltyRef("");
        setWalkInCustomerRedeemedPoints && setWalkInCustomerRedeemedPoints("");
        setError("");
        setIsModalOpen(false); // Close modal on success
      } catch (error) {
        toast.error(error.response?.data?.message || "Customer not added", {
          autoClose: 2000,
          className: "custom-toast",
        });
        setError("");
      }
    };

    const handleEditHoldProduct = async (heldProduct) => {
      try {
        const productToAdd = heldProduct.products.map((product) => {
          const baseDetails = product.baseProductDetails || {};

          let productPrice = product.price;
          let productQty = baseDetails.productQty || null;

          if (product.variation && product.variationValues) {
            const selectedVariation = product.variationValues[product.variation];

            if (selectedVariation) {
              productPrice = selectedVariation.productPrice || productPrice;
              productQty = selectedVariation.productQty || productQty;
            }
          }
          return {
            holdProductID: product._id,
            id: product.currentID,
            name: product.name,
            tax: product.tax,
            price: product.price || productPrice,
            stokeQty: product.stokeQty || productQty,
            qty: product.purchaseQty,
            discount: product.discount,
            ptype: product.ptype || "Single",
            selectedVariation: product.variation ? product.variation : null,
            variationValues: {
              ...baseDetails.variationValues,
            },
            wholesaleEnabled: product.wholesaleEnabled || false,
            wholesaleMinQty: product.wholesaleMinQty || 0,
            wholesalePrice: product.wholesalePrice || 0,
          };
        });

        const uniqueProductsToAdd = productToAdd.filter((newProduct) => {
          return !productBillingHandling.some((existingProduct) => {
            return (
              existingProduct.curruntID === newProduct.curruntID &&
              existingProduct.selectedVariation === newProduct.selectedVariation
            );
          });
        });
        setProductBillingHandling(uniqueProductsToAdd);
        handleDeleteHoldProduct(heldProduct._id, heldProducts, setHeldProducts);
        setIsHoldList(false);
      } catch (error) {
        console.error("Error fetching products by IDs:", error);
      }
    };

    const handlePopupClose = () => {
      setIsPopupOpen(false);
    };

    const handleExitingPopupClose = () => {
      setIsExitingPopupOpen(false);
    };

    const handleRegisterReportOpen = async () => {
      if (!cashierUsername) {
        setErrorMessage("Cashier username is not set.");
        return;
      }
      setIsPopUpRegisterReport(true);
      setErrorMessage(null);

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/api/findRegisterData/${cashierUsername}`
        );

        if (response.data && response.data.data) {
          const register = response.data.data;
          setRegisterData([register]);
          setCashHandIn(register.cashHandIn || 0);
          setCashierName(register.name || "Unknown Cashier");
          setTotalAmount(register.totalBalance || 0);
          setOpenTime(register.openTime || "");
        } else {
          console.error(
            "Unexpected response format or empty data:",
            response.data
          );
          setRegisterData([]);
          setErrorMessage("No register data found for this user.");
        }
      } catch (err) {
        console.error("Error fetching report data:", err);
        setErrorMessage("Failed to fetch report data");
        setRegisterData([]);
      } finally {
        stopLoading();
        refreshAllReports();
      }
    };

    const handleRegisterReportClose = () => {
      setIsPopUpRegisterReport(false);
    };

    const handlePOSClose = async () => {
      const cashRegisterID = sessionStorage.getItem("cashRegisterID");
      if (!cashRegisterID) return;

      try {
        const transformedInputs = Object.entries(inputs)
          .map(([key, value]) => ({
            denomination: parseInt(key.replace("amount", ""), 10),
            quantity: value,
            amount: parseInt(key.replace("amount", ""), 10) * value,
          }))
          .filter((item) => item.quantity > 0);

        const transactionData = {
          cashierUsername,
          cashRegisterID,
          cashierName: cashierName || "Unknown Cashier",
          openedTime: openTime,
          cardPaymentAmount: cardPaymentAmount || 0,
          cashPaymentAmount: cashPaymentAmount || 0,
          bankTransferPaymentAmount: bankTransferPaymentAmount || 0,
          totalDiscountAmount: totalDiscountAmount || 0,
          totalAmount: totalBalance - cashHandIn,
          grandTotal: totalSaleAmount,
          cashHandIn: cashHandIn || 0,
          inputs: transformedInputs,
          cashVariance: parseFloat(
            Math.max(0, cashPaymentAmount + cashHandIn - calculateTotal())
          ),
        };

        //1. First save transaction data
        await axios.post(
          `${process.env.REACT_APP_BASE_URL}/api/saveZreadingBill`,
          transactionData,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        // 2. Close the register after successful save
        await axios.delete(
          `${process.env.REACT_APP_BASE_URL}/api/closeRegister/${cashRegisterID}`
        );

        //Cleanup
        toast.success(
          "POS close successfully!",
          { autoClose: 2000 },
          { className: "custom-toast" }
        );
        sessionStorage.removeItem("cashRegisterID");
        sessionStorage.removeItem("cashierUsername");
        sessionStorage.removeItem("name");
        setIsPopupOpen(false);
        navigate("/dashboard");
      } catch (error) {
        console.error("POS Closure Error:", error);
        const errorContext = error.config?.url?.includes("saveZreadingBill")
          ? "Failed to save transaction data"
          : "Failed to close register";

        setErrorMessage(
          error.response?.data?.message || `${errorContext}: ${error.message}`
        );
        toast.error(
          "Error closing POS!",
          { autoClose: 2000 },
          { className: "custom-toast" }
        );

        if (error.config?.url?.includes("closeRegister")) {
          sessionStorage.removeItem("cashRegisterID");
          sessionStorage.removeItem("cashierUsername");
        }
      }
    };

    const handleExitingFromPos = () => {
      setIsExitingPopupOpen(false);
      navigate("/dashboard");
    };

    let username = "";
    const encryptedCashierUsername = sessionStorage.getItem("cashierUsername");
    if (encryptedCashierUsername) {
      try {
        const userKey = CryptoJS.AES.decrypt(
          encryptedCashierUsername,
          "ldunstvd"
        );
        username = userKey.toString(CryptoJS.enc.Utf8);

        if (!username) {
          //console.error('Decryption successful, but username is empty.');
        }
      } catch (error) {
        console.error("Error decrypting username:", error);
      }
    } else {
      console.error("No cashierUsername found in sessionStorage.");
    }

    const handleHorizontalScroll = (e, containerId) => {
      e.preventDefault();
      const container = document.getElementById(containerId);
      if (container) {
        container.scrollBy({
          left: e.deltaY,
        });
      }
    };
  

    // Fetch services data
    const fetchServices = async () => {
  try {
    setProgress(true);
    console.log('Fetching all services with warehouse:', warehouse);
    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/findAllServiceNoPagination`);
    const data = await response.json();
    console.log('Raw service response:', data);
    
    if (data.status && Array.isArray(data.services) && data.services.length > 0) {
      const transformedServices = data.services.map(service => {
        // Use backend-calculated finalPrice if available, otherwise calculate it
        const finalCalculatedPrice = service.finalPrice !== undefined ? 
          parseFloat(service.finalPrice) : 
          (() => {
            let finalPrice = parseFloat(service.price) || 0;
            let taxAmount = 0;
            let discountAmount = 0;

            if (service.orderTax && parseFloat(service.orderTax) > 0) {
              if (service.taxType === 'percentage') {
                taxAmount = (finalPrice * parseFloat(service.orderTax)) / 100;
              } else {
                taxAmount = parseFloat(service.orderTax);
              }
            }

            if (service.discount && parseFloat(service.discount) > 0) {
              if (service.discountType === 'percentage') {
                discountAmount = (finalPrice * parseFloat(service.discount)) / 100;
              } else {
                discountAmount = parseFloat(service.discount);
              }
            }

            finalPrice = finalPrice + taxAmount - discountAmount;
            return Math.max(0, finalPrice);
          })();

        return {
          _id: service._id,
          productName: service.serviceName,
          serviceName: service.serviceName,
          name: service.serviceName,
          code: `SRV-${service._id.slice(-6)}`,
          description: service.description,
          price: [{
            price: finalCalculatedPrice,
            minQty: 1
          }],
          image: null,
          saleUnit: 'Service',
          isService: true,
          ptype: 'simple',
          taxType: service.taxType || 'exclusive',
          originalPrice: service.price || 0,
          originalTax: service.orderTax || 0,
          originalTaxType: service.taxType || 'fixed',
          originalDiscount: service.discount || 0,
          originalDiscountType: service.discountType || 'fixed',
          tax: [{
            taxPercentage: service.orderTax || 0,
            taxType: service.taxType || 'exclusive'
          }],
          discount: [{
            discountPercentage: service.discount || 0,
            discountType: service.discountType || 'percentage'
          }],
          warranty: 0,
          variation: [],
          variationType: 'None',
          warehouseData: [{
            warehouseName: warehouse || 'default',
            qty: 999999,
            productQty: 999999
          }],
          warehouse: {
            [warehouse || 'default']: {
              productPrice: finalCalculatedPrice,
              productQty: 999999,
              orderTax: service.orderTax || 0,
              discount: service.discount || 0,
              taxType: service.taxType || 'exclusive',
              discountType: service.discountType || 'fixed',
              variationValues: {},
              wholesaleEnabled: false,
              wholesaleMinQty: 0,
              wholesalePrice: 0,
              productCost: finalCalculatedPrice
            }
          }
        };
      });
        
      setServices(transformedServices);
      console.log('Transformed services with calculated prices:', transformedServices);
    } else {
      console.log('No services found or invalid response:', data);
      setServices([]);
    }
  } catch (error) {
    console.error('Error fetching services:', error);
    setServices([]);
  } finally {
    setProgress(false);
  }
};
  //search  services
const handleServiceSearch = async (searchTerm) => {
  if (!showServicesData) return; // Only search services when in service mode

  if (searchTerm.trim() === "") {
    fetchServices(); // Load all services if search is empty
    setSearchedServiceData([]); // Clear service search results
    setSearchedProductDataByName([]); // Clear product search results
    return;
  }

  setLoading(true);
  try {
    const searchType = determineSearchTypeOfService(searchTerm); // Use utility function to determine search type
    const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchService`, {
      params: { keyword: searchTerm.trim(), searchType }
    });

    if (response.data.services && Array.isArray(response.data.services)) {
      const transformedServices = response.data.services.map(service => {
        // Use backend-calculated finalPrice if available, otherwise calculate it
        const finalCalculatedPrice = service.finalPrice !== undefined ? 
          parseFloat(service.finalPrice) : 
          (() => {
            let finalPrice = parseFloat(service.price) || 0;
            let taxAmount = 0;
            let discountAmount = 0;

            if (service.orderTax && parseFloat(service.orderTax) > 0) {
              if (service.taxType === 'percentage') {
                taxAmount = (finalPrice * parseFloat(service.orderTax)) / 100;
              } else {
                taxAmount = parseFloat(service.orderTax);
              }
            }

            if (service.discount && parseFloat(service.discount) > 0) {
              if (service.discountType === 'percentage') {
                discountAmount = (finalPrice * parseFloat(service.discount)) / 100;
              } else {
                discountAmount = parseFloat(service.discount);
              }
            }

            finalPrice = finalPrice + taxAmount - discountAmount;
            return Math.max(0, finalPrice);
          })();

        return {
          _id: service._id,
          productName: service.serviceName,
          serviceName: service.serviceName,
          name: service.serviceName,
          code: `SRV-${service._id.slice(-6)}`,
          description: service.description,
          price: [{
            price: finalCalculatedPrice,
            minQty: 1
          }],
          image: null,
          saleUnit: 'Service',
          isService: true,
          ptype: 'simple',
          taxType: service.taxType || 'exclusive',
          originalPrice: service.price || 0,
          originalTax: service.orderTax || 0,
          originalTaxType: service.taxType || 'fixed',
          originalDiscount: service.discount || 0,
          originalDiscountType: service.discountType || 'fixed',
          tax: [{
            taxPercentage: service.orderTax || 0,
            taxType: service.taxType || 'exclusive'
          }],
          discount: [{
            discountPercentage: service.discount || 0,
            discountType: service.discountType || 'percentage'
          }],
          warranty: 0,
          variation: [],
          variationType: 'None',
          warehouseData: [{
            warehouseName: warehouse || 'default',
            qty: 999999,
            productQty: 999999
          }],
          warehouse: {
            [warehouse || 'default']: {
              productPrice: finalCalculatedPrice,
              productQty: 999999,
              orderTax: service.orderTax || 0,
              discount: service.discount || 0,
              taxType: service.taxType || 'exclusive',
              discountType: service.discountType || 'fixed',
              variationValues: {},
              wholesaleEnabled: false,
              wholesaleMinQty: 0,
              wholesalePrice: 0,
              productCost: finalCalculatedPrice
            }
          }
        };
      });

      console.log('Service search results:', transformedServices);
      setSearchedServiceData(transformedServices); // Store results in searchedServiceData
    } else {
      console.log('No services found for search term:', searchTerm);
      setSearchedServiceData([]);
    }
  } catch (error) {
    console.error('Service search error:', error);
    setSearchedServiceData([]);
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
      const fetchReportData = async () => {
        startLoading();
        try {
          let url = `${process.env.REACT_APP_BASE_URL}/api/getZReportData/${cashRegisterID}`;
          const response = await axios.get(url);
          const sales = response.data.data.sales;

          const { totalDiscountAmount } = sales.reduce(
            (totals, sale) => {
              if (sale && sale.productsData) {
                let saleSubtotal = 0;
                let productDiscounts = 0;
                if (sale.pureProfit !== undefined) {
                  totals.totalProfitAmount += parseFloat(sale.pureProfit) || 0;
                }

                sale.productsData.forEach((product) => {
                  const quantity = parseFloat(product.quantity || 0);
                  const price = parseFloat(product.price || 0);
                  const discount = parseFloat(product.discount || 0);
                  const specialDiscount = parseFloat(
                    product.specialDiscount || 0
                  );
                  const taxRate = parseFloat(product.taxRate || 0);

                  productDiscounts += (discount + specialDiscount) * quantity;
                  const netPrice =
                    (price - discount - specialDiscount) * quantity +
                    price * quantity * taxRate;
                  saleSubtotal += netPrice;
                });

                let saleDiscount = 0;
                if (sale.discount) {
                  const discountValue = parseFloat(sale.discount);
                  saleDiscount =
                    sale.discountType === "percentage"
                      ? saleSubtotal * (discountValue / 100)
                      : discountValue;
                }
                const offerDiscount =
                  saleSubtotal * (parseFloat(sale.offerPercentage || 0) / 100);

                totals.grandTotal += saleSubtotal;
                totals.totalDiscountAmount +=
                  productDiscounts + saleDiscount + offerDiscount;
              }
              return totals;
            },
            {
              grandTotal: 0,
              totalDiscountAmount: 0,
              totalProfitAmount: 0,
            }
          );

          setTotalDiscountAmount(totalDiscountAmount);
        } catch (error) {
          console.error("Error fetching report data:", error);
          setError("Failed to fetch report data");
        } finally {
          setLoading(false);
          setLoadingCir(false);
        }
      };

      fetchReportData();
    }, [regDataFetching, refreshKey]);

    useEffect(() => {
      const fetchReportData = async () => {
        setLoading(true);
        try {
          let url = `${process.env.REACT_APP_BASE_URL}/api/getZReportData/${cashRegisterID}`;
          const response = await axios.get(url);
          const sales = response.data.data.sales;

          let cardTotal = 0;
          let cashTotal = 0;
          let bankTransferTotal = 0;

          sales.forEach((sale) => {
            sale.paymentType?.forEach((payment) => {
              switch (payment.type) {
                case "card":
                  cardTotal += payment.amount;
                  break;
                case "cash":
                  cashTotal += payment.amount;
                  break;
                case "bank_transfer":
                  bankTransferTotal += payment.amount;
                  break;
                default:
                  cashTotal += payment.amount;
                  break;
              }
            });
          });

          const totalCashBalance = sales.reduce(
            (sum, sale) => sum + (sale.cashBalance || 0),
            0
          );
          cashTotal += totalCashBalance;

          const cashierTotalSale = cashTotal + cardTotal + bankTransferTotal;
          setCardPaymentAmount(cardTotal);
          setCashPaymentAmount(cashTotal);
          setBankTransferPaymentAmount(bankTransferTotal);
          setCashierTotalSale(cashierTotalSale);
        } catch (error) {
          console.error("Error fetching report data:", error);
          setError("Failed to fetch report data");
        } finally {
          setLoading(false);
        }
      };

      fetchReportData();
    }, [regDataFetching, refreshKey]);

    useEffect(() => {
      const fetchReportData = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_BASE_URL}/api/getTodayReportData/${warehouse}`
          );
          const posSales = response.data.data.sales.filter(
            (sale) => sale.saleType === "POS"
          );
          const totalSaleAmount = posSales.reduce(
            (total, sale) => total + parseFloat(sale.grandTotal || 0),
            0
          );
          console.log(totalSaleAmount);
          setTotalSale(totalSaleAmount);
        } catch (error) {
          console.error("Error fetching report data:", error);
          setError("Failed to fetch report data");
        } finally {
          setLoading(false);
        }
      };

      fetchReportData();
    }, [warehouse, registerData, refreshKey]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setInputs({
        ...inputs,
        [name]: value,
      });
    };

    const calculateTotal = () => {
      const total =
        inputs.amount20 * 20 +
        inputs.amount50 * 50 +
        inputs.amount100 * 100 +
        inputs.amount500 * 500 +
        inputs.amount1000 * 1000 +
        inputs.amount5000 * 5000 +
        inputs.amount1 * 1 +
        inputs.amount2 * 2 +
        inputs.amount5 * 5 +
        inputs.amount10 * 10;
      return total;
    };

   // Replace your existing handleRealTimeSearch function with this updated version
const handleRealTimeSearch = async (searchTerm) => {
  if (searchTerm.trim() === "") {
    setSearchedProductDataByName([]);
    return;
  }
  
  setLoading(true);
  try {
    if (showServicesData) {
      // Only search services when in service mode
      const serviceResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchService`, {
        params: {
          keyword: searchTerm,
        },
      }).catch(error => {
        console.log('Service search failed:', error);
        return { data: { services: [] } };
      });

      const services = serviceResponse.data.services || [];

      // Transform services to match product format
      const transformedServices = services.map(service => {
        const calculateServiceFinalPrice = (service) => {
          let finalPrice = parseFloat(service.price) || 0;
          let taxAmount = 0;
          let discountAmount = 0;

          // Calculate tax
          if (service.orderTax && parseFloat(service.orderTax) > 0) {
            if (service.taxType === 'percentage') {
              taxAmount = (finalPrice * parseFloat(service.orderTax)) / 100;
            } else {
              taxAmount = parseFloat(service.orderTax);
            }
          }

          // Calculate discount
          if (service.discount && parseFloat(service.discount) > 0) {
            if (service.discountType === 'percentage') {
              discountAmount = (finalPrice * parseFloat(service.discount)) / 100;
            } else {
              discountAmount = parseFloat(service.discount);
            }
          }

          finalPrice = finalPrice + taxAmount - discountAmount;
          return Math.max(0, finalPrice);
        };

        const finalCalculatedPrice = calculateServiceFinalPrice(service);

        return {
          _id: service._id,
          productName: service.serviceName,
          serviceName: service.serviceName,
          name: service.serviceName,
          code: `SRV-${service._id.slice(-6)}`,
          description: service.description,
          price: [{
            price: finalCalculatedPrice,
            minQty: 1
          }],
          image: null,
          saleUnit: 'Service',
          isService: true,
          ptype: 'simple',
          taxType: service.taxType || 'exclusive',
          originalPrice: service.price || 0,
          originalTax: service.orderTax || 0,
          originalTaxType: service.taxType || 'fixed',
          originalDiscount: service.discount || 0,
          originalDiscountType: service.discountType || 'fixed',
          warehouse: {
            [warehouse || 'default']: {
              productPrice: finalCalculatedPrice,
              productQty: 999999,
              orderTax: service.orderTax || 0,
              discount: service.discount || 0,
              taxType: service.taxType || 'exclusive',
              discountType: service.discountType || 'fixed',
              variationValues: {},
              wholesaleEnabled: false,
              wholesaleMinQty: 0,
              wholesalePrice: 0,
              productCost: finalCalculatedPrice
            }
          }
        };
      });

      console.log('Service search results:', transformedServices);
      setSearchedProductDataByName(transformedServices);

    } else {
      // Only search products when NOT in service mode
      const productResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findProductByName`, {
        params: {
          keyword: searchTerm,
          warehouse: warehouse,
        },
      }).catch(error => {
        console.log('Product search failed:', error);
        return { data: { products: [] } };
      });

      const products = productResponse.data.products || [];
      
      console.log('Product search results:', {
        productsFound: products.length,
        searchTerm: searchTerm
      });

      setSearchedProductDataByName(products);
    }

  } catch (error) {
    console.error("Error searching:", error);
    setSearchedProductDataByName([]);
  } finally {
    setLoading(false);
  }
};

    const debounce = (func, delay) => {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
      };
    };

    const debouncedSearch = debounce(handleRealTimeSearch, 300);

const handleInputNameChange = (e) => {
  const value = e.target.value;
  setProductNameOrCode(value);

  if (value.trim() === "") {
    // Clear all search results when search is empty
    setSearchedProductDataByName([]);
    setSearchedServiceData([]);
    
    if (showServicesData) {
      fetchServices(); // Reload all services when search is cleared
    }
  } else {
    if (showServicesData) {
      // When in service mode, use the debounced service search
      debouncedServiceSearch(value, setSearchedServiceData, setLoading, setError, warehouse);
    } else {
      // When in product mode, use the product search
      debouncedSearch(value);
    }
  }
};
    useEffect(() => {
      console.log("Combined products:", combinedProductData);
    }, [searchedProductData, combinedProductData]);

    const LoadingOverlay = () =>
      loadingCir ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="loader"></div>
        </div>
      ) : null;

    return (
      <div className="bg-[#eff3f7] absolute w-full h-screen p-2 overflow-hidden">
        {/* HEADER SECTION */}
        <div className="flex justify-between  w-full h-[80px]">
          <div className="flex justify-between w-[34.9%] bg-white h-[80px] rounded-[15px] ">
            <div className="w-1/2 h-[82px] flex items-center relative  pb-[2px]">
              <form className="flex items-center relative w-full">
                <input
                  name="keyword"
                  type="text"
                  placeholder="Find Customer"
                  className="searchBox w-[100%] m-2 pl-10 py-5 px-4 border border-gray-300 rounded-[10px] shadow-sm focus:border-transparent"
                  value={keyword}
                  onChange={handleFindUser}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-6 flex items-center text-gray-400"
                >
                  <svg
                    className="h-4 w-4"
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

              {keyword && searchCustomerResults.length > 0 && (
                <div className="absolute top-[90px] w-[94%] mr-2 text-left overflow-y-scroll h-[350px] left-[7px] bg-white border border-gray-300 rounded-lg shadow-md">
                  <ul className="">
                    {searchCustomerResults.map((customer, index) => (
                      <li
                        key={index}
                        className="p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          console.log("Selected customer:", customer);
                          setSelectedCustomer(customer._id);
                          setSelectedCustomerData(customer);
                          setSelectedCustomerName(customer.name);
                          setKeyword("");
                          setSearchCustomerResults([]);
                        }}
                      >
                        {customer.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                {/* Button to open modal */}
                <button
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-300"
                  onClick={() => setIsModalOpen(true)}
                >
                  <img
                    className="w-[20px] h-[20px] hover:scale-110 transition-transform duration-300"
                    src={User}
                    alt="add user"
                  />
                </button>

                {/* Modal for Walk-In Customer */}
                {isModalOpen && (
                  <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center backdrop-blur-sm z-[1000]">
                    <div className="bg-white w-[350px] sm:w-[400px] p-6 rounded-2xl shadow-2xl transform scale-100 opacity-0 animate-fadeIn">
                      <div className="flex items-center justify-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-700 text-center">
                          Add Customer
                        </h2>
                      </div>
                      <form onSubmit={handleWalkInCustomerSubmit}>
                        <div className="relative mb-4">
                          <input
                            type="text"
                            placeholder="Enter customer name"
                            value={walkInCustomerName}
                            onChange={(e) =>
                              setWalkInCustomerName(e.target.value)
                            }
                            className="w-full border border-gray-300 p-3 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                            required
                            title="Customer name is required."
                          />
                          <span className="absolute left-3 top-3 text-gray-400">
                            <i className="fas fa-user"></i>
                          </span>
                        </div>
                        <div className="relative mb-4">
                          <input
                            type="text"
                            placeholder="Enter NIC"
                            value={walkInCustomerNic}
                            onChange={(e) => setWalkInCustomerNic(e.target.value)}
                            className="w-full border border-gray-300 p-3 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                            required
                            title="NIC is required and must be exactly 12 characters."
                          />
                          <span className="absolute left-3 top-3 text-gray-400">
                            <i className="fas fa-id-card"></i>
                          </span>
                        </div>
                        <div className="relative mb-4">
                          <input
                            type="text"
                            placeholder="Enter Mobile: 0XXXXXXXXX"
                            value={walkInCustomerMobile}
                            onChange={(e) =>
                              setWalkInCustomerMobile(e.target.value)
                            }
                            className="w-full border border-gray-300 p-3 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                            required
                            // pattern="^0\d{9}$"
                            // title="Enter a valid mobile number in the format 0XXXXXXXXX."
                          />
                          <span className="absolute left-3 top-3 text-gray-400">
                            <i className="fas fa-phone-alt"></i>
                          </span>
                        </div>
                        {/* Loyalty Reference Number */}
                        {typeof walkInCustomerLoyaltyRef !== "undefined" && (
                          <div className="relative mb-4">
                            <input
                              type="text"
                              placeholder="Loyalty Reference Number"
                              value={walkInCustomerLoyaltyRef}
                              onChange={(e) =>
                                setWalkInCustomerLoyaltyRef(e.target.value)
                              }
                              className="w-full border border-gray-300 p-3 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              required
                              title="Loyalty reference is required."
                            />
                            <span className="absolute left-3 top-3 text-gray-400">
                              <i className="fas fa-id-card"></i>
                            </span>
                          </div>
                        )}
                        {/* Redeemed Points */}
                        {typeof walkInCustomerRedeemedPoints !== "undefined" && (
                          <div className="relative mb-4">
                            <input
                              type="number"
                              placeholder="Redeemed Points"
                              value={walkInCustomerRedeemedPoints}
                              onChange={(e) =>
                                setWalkInCustomerRedeemedPoints(e.target.value)
                              }
                              className="w-full border border-gray-300 p-3 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              title="Redeemed Points (optional)"
                            />
                            <span className="absolute left-3 top-3 text-gray-400">
                              <i className="fas fa-star"></i>
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <button
                            type="submit"
                            className="submit text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          >
                            Create
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-1/2 h-[82px] flex items-center pb-[2px] relative rounded-[15px] mr-1 ">
              <form className="w-full">
                <select
                  id="warehouse"
                  name="warehouse"
                  value={warehouse}
                  onChange={handleWarehouseChange}
                  className="searchBox w-[97%]  pl-4 pr-2 py-5 border border-gray-300 rounded-[10px] shadow-sm focus:border-transparent"
                >
                  <option value="">Select a warehouse</option>
                  {filters.warehouses.map((wh) => (
                    <option key={wh.name} value={wh.name}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </form>
            </div>
          </div>

          <div className="w-[65%] ml-2 rounded-[15px] relative h-[80px] bg-white flex flex-col lg:flex-row items-start lg:items-center">
            <div className="w-1/2 flex flex-col sm:w-full sm:flex-row gap-2">
              {/* Search by Code */}
              <div className="relative w-full flex flex-col sm:flex-row items-center justify-between gap-2 mr-4">
                <form
                  ref={inputRef}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleProductSubmit(
                      Productkeyword,
                      setLoading,
                      setSearchedProductData,
                      setProductData,
                      setSelectedCategoryProducts,
                      setSelectedBrandProducts,
                      setError
                    );
                  }}
                  className="relative w-full sm:w-auto flex-grow"
                >
                  <input
                    name="Productkeyword"
                    type="text"
                    placeholder="Find By code"
                    className="searchBox w-full m-2 pl-10 pr-2 py-5 border border-gray-300 rounded-[10px] shadow-sm focus:border-transparent"
                    value={Productkeyword}
                    ref={inputRef}
                    onChange={(e) => {
                      setProductKeyword(e.target.value);
                    }}
                  />
                  <p
                    type="button"
                    className="absolute inset-y-0 left-0 pl-6 flex items-center text-gray-400"
                  >
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
                  </p>
                </form>

                <form className="relative w-full sm:w-auto flex-grow">
                  <input
                    name="Productkeyword"
                    type="text"
                    placeholder="Find By Name / code"
                    className="searchBox w-full m-2 pl-10 pr-2 py-5 border border-gray-300 rounded-[10px] shadow-sm focus:border-transparent"
                    value={ProductNameOrCode}
                    onChange={handleInputNameChange}
                  />
                  <p
                    type="button"
                    className="absolute inset-y-0 left-0 pl-6 flex items-center text-gray-400"
                  >
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
                  </p>
                </form>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-0 h-[78px] justify-end md:mt-2 md:mb-2 sm:justify-between sm:bg-white sm:w-full sm:mr-1 rounded-xl leading-none box-border">
              <div className="relative p-2 m-2 w-[65px] h-[65px] border bg-[#44BC8D] rounded-[10px] flex items-center justify-center">
                <button onClick={() => handleHoldOpen(setIsHoldList)}>
                  <img className="w-[45px] h-[45px]" src={Menu} alt="" />
                </button>

                {/* Notification Badge */}
                {heldProducts && heldProducts.length > 0 && (
                  <span className="absolute top-[-8px] right-[-8px] bg-red-400 text-white text-xs rounded-full w-6 h-6 p-2 flex items-center justify-center">
                    {heldProducts.length}
                  </span>
                )}
              </div>

              <div className="p-2 m-2 w-[65px] h-[65px] border bg-[#44BC8D] rounded-[10px] flex items-center justify-center">
                <button
                  onClick={() => {
                    console.log('Services button clicked - opening popup');
                    fetchServices(); // Fetch services when opening popup
                    setIsServicesPopupOpen(true); // Open the popup
                  }}
                  className="focus:outline-none flex flex-col items-center justify-center text-white"
                >
                  <div className="w-[45px] h-[45px] flex items-center justify-center">
                    <svg
                      className="w-8 h-8"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Popup for Hold list */}
              {isHoldList && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white w-[600px] max-h-[450px] p-6 rounded-md shadow-lg overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                      Held Products
                    </h2>

                    {/* Handle no held products */}
                    {heldProducts && heldProducts.length === 0 ? (
                      <div className="text-center text-gray-500">
                        <p>No held products available.</p>
                      </div>
                    ) : (
                      /* Table to display held products */
                      <table className="min-w-full bg-white border">
                        <thead>
                          <tr>
                            <th className="border px-4 py-2 text-gray-600">ID</th>
                            <th className="border px-4 py-2 text-gray-600">
                              Reference No
                            </th>
                            <th className="border px-4 py-2 text-gray-600">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {heldProducts.map((product) => (
                            <tr key={product._id}>
                              <td className="border px-4 py-2 text-left">
                                {product._id}
                              </td>
                              <td className="border px-4 py-2 text-left">
                                {product.referenceNo}
                              </td>
                              <td className="border px-4 py-2 flex text-left">
                                {/* Edit and Delete actions */}
                                <button
                                  className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 flex items-center"
                                  style={{ background: "transparent" }}
                                  onClick={() => handleEditHoldProduct(product)}
                                >
                                  <i className="fas fa-edit mr-1"></i>
                                </button>
                                <button
                                  className="text-red-500 hover:text-red-700 font-bold py-1 px-2"
                                  style={{ background: "transparent" }}
                                  onClick={() =>
                                    handleDeleteHoldProduct(
                                      product._id,
                                      heldProducts,
                                      setHeldProducts
                                    )
                                  }
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    <div className="flex justify-end mt-4">
                      <button
                        className="px-4 py-2 bg-red-500 text-white rounded-md"
                        onClick={() => handleHoldOpen(setIsHoldList)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-2 m-2 w-[65px] h-[65px] border bg-[#44BC8D] rounded-[10px] flex items-center justify-center">
                <button onClick={() => handlePopupOpen(setIsPopupOpen)}>
                  <img className="w-[45px] h-[45px]" src={pro} alt="" />
                </button>
              </div>

              <div className="p-2 m-2 w-[65px] h-[65px] border bg-[#1A5B63] rounded-[10px] flex items-center justify-center">
                <Link to={"/viewSale"}>
                  <img className="w-[45px] h-[45px]" src={SL_R} alt="" />
                </Link>
              </div>

              {/* Popup for pos close*/}
              {isPopupOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white w-[400px] h-[240px] p-6 rounded-md shadow-lg">
                    <h2 className="text-xl text-gray-700 font-semibold">
                      Closing POS
                    </h2>
                    <p>Are you sure you want to Close the Register?</p>
                    <div className="flex  mt-4">
                      <button
                        className="px-4 py-2 mr-2 bg-gray-500 text-white rounded-md"
                        onClick={() => handlePopupClose(setIsPopupOpen)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 button-bg-color text-white rounded-md"
                        onClick={() => {
                          console.log("POS closed");
                          handleRegisterReportOpen(
                            setIsPopUpRegisterReport,
                            setIsPopupOpen
                          );
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Popup Register report*/}
              {isPopUpRegisterReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div
                    className="bg-white
                                  md:w-[75%] lg:h-[700px]   
                                  lg:w-[70%] lg:h-[680px] 
                                  xl:w-[64%] xl:h-[670px]
                                  2xl:w-[60%] xl:h-[650px] 
                                  p-6 rounded-md shadow-lg overflow-x-auto scroll-container"
                  >
                    <h2 className="text-xl text-gray-800 font-semibold">
                      Register Report
                    </h2>
                    {loading ? (
                      <p>Loading</p>
                    ) : registerData.length > 0 ? (
                      <div className="pl-6 pr-6 pt-2 pb-1">
                        <table className="min-w-full bg-white border border-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="align-top px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Open Time
                              </th>
                              <th className="align-top px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cashier
                              </th>
                              <th className="align-top px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cash hand in
                              </th>
                              <th className="align-top px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Your Sale <br />
                                <p className="text-[10px]">(Without Cash Hand)</p>
                              </th>
                              <th className="align-top px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Today Total Sale <br />
                                <p className="text-[10px]">(Without Cash Hand)</p>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {registerData.map((reg) => (
                              <tr key={reg._id}>
                                <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">
                                  <p className="rounded-[5px] text-center p-[6px] bg-red-100 text-red-500">
                                    {reg.openTime}
                                  </p>
                                </td>
                                <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">
                                  {reg.name}
                                </td>
                                <td className="px-4 py-5 text-left whitespace-nowrap text-m text-gray-900">
                                  <p className="rounded-[5px] text-center py-[6px] bg-blue-100 text-blue-500">
                                    {currency}{" "}
                                    {formatWithCustomCommas(reg.cashHandIn)}
                                  </p>
                                </td>
                                <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">
                                  <p className="rounded-[5px] text-center py-[6px] bg-green-100 text-green-500">
                                    {currency}{" "}
                                    {formatWithCustomCommas(cashierTotalSale)}
                                  </p>
                                </td>
                                <td className="px-7 py-5 text-left whitespace-nowrap text-m text-gray-900">
                                  <p className="rounded-[5px] text-center py-[6px] bg-green-100 text-green-500">
                                    {currency}{" "}
                                    {formatWithCustomCommas(totalSaleAmount)}
                                  </p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                    <div className="overflow-x-auto pl-6 pr-6 pt-2 pb-4">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                            Total Discount :{" "}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formatWithCustomCommas(
                                totalDiscountAmount || 0
                              )}
                              className="w-full border border-gray-300 p-3 pl-14 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                            />
                            <span className="absolute rounded-l-lg left-[1px] px-3 py-4 bg-gray-100 top-1/2 transform -translate-y-1/2">
                              {currency}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                            Cash :{" "}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formatWithCustomCommas(
                                cashPaymentAmount || 0
                              )}
                              className="w-full border border-gray-300 p-3 pl-14 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                            />
                            <span className="absolute rounded-l-lg left-[1px] px-3 py-4 bg-gray-100 top-1/2 transform -translate-y-1/2">
                              {currency}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                            Card :{" "}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formatWithCustomCommas(
                                cardPaymentAmount || 0
                              )}
                              className="w-full border border-gray-300 p-3 pl-14 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                            />
                            <span className="absolute rounded-l-lg left-[1px] px-3 py-4 bg-gray-100 top-1/2 transform -translate-y-1/2">
                              {currency}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium leading-6 text-gray-900 text-left">
                            Bank Transfer :{" "}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formatWithCustomCommas(
                                bankTransferPaymentAmount || 0
                              )}
                              className="w-full border  border-gray-300 p-3 pl-14 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                            />
                            <span className="absolute rounded-l-lg left-[1px] px-3 py-4 bg-gray-100 top-1/2 transform -translate-y-1/2">
                              {currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="justify-left sw-4/4 overflow-x-auto pl-6 pr-6 pt-2 pb-4">
                      <h1 className="text-left pb-2 semibold">
                        Handle Cash Balancing
                      </h1>
                      <div className="flex bg-opacity-50 bg-gray-100 pl-6 pr-6 pt-2 pb-4 rounded-xl">
                        <div className="flex w-[40%]">
                          <div className="gap flex flex-col">
                            <div className="flex items-center justify-between mt-1">
                              <label className="mr-2">20 x </label>
                              <input
                                type="number"
                                name="amount20"
                                value={inputs.amount20}
                                onChange={handleInputChange}
                                className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <label className="mr-2">50 x </label>
                              <input
                                type="number"
                                name="amount50"
                                value={inputs.amount50}
                                onChange={handleInputChange}
                                className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <label className="mr-2">100 x </label>
                              <input
                                type="number"
                                name="amount100"
                                value={inputs.amount100}
                                onChange={handleInputChange}
                                className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <label className="mr-2">500 x </label>
                              <input
                                type="number"
                                name="amount500"
                                value={inputs.amount500}
                                onChange={handleInputChange}
                                className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <label className="mr-2">1000 x </label>
                              <input
                                type="number"
                                name="amount1000"
                                value={inputs.amount1000}
                                onChange={handleInputChange}
                                className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <label className="mr-2">5000 x </label>
                              <input
                                type="number"
                                name="amount5000"
                                value={inputs.amount5000}
                                onChange={handleInputChange}
                                className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              />
                            </div>
                          </div>

                          <div className="ml-5 gap flex flex-col">
                            <div className="flex items-center justify-between mt-1">
                              <label className="mr-2">1 x </label>
                              <input
                                type="number"
                                name="amount1"
                                value={inputs.amount1}
                                onChange={handleInputChange}
                                className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <label className="mr-2">2 x </label>
                              <input
                                type="number"
                                name="amount2"
                                value={inputs.amount2}
                                onChange={handleInputChange}
                                className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <label className="mr-2">5 x </label>
                              <input
                                type="number"
                                name="amount5"
                                value={inputs.amount5}
                                onChange={handleInputChange}
                                className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <label className="mr-2">10 x </label>
                              <input
                                type="number"
                                name="amount10"
                                value={inputs.amount10}
                                onChange={handleInputChange}
                                className="w-[100px] border border-gray-300 px-3 py-1 pl-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="ml-10 justify-end gap">
                          <div className="flex flex-col justify-end relative">
                            <label className="mb-2 text-left">Total Cash</label>
                            <div className="relative w-[170px]">
                              <span
                                className={`absolute rounded-l-lg left-2 top-1/2 transform -translate-y-1/2 ${
                                  calculateTotal() === 0
                                    ? "text-red-500"
                                    : "text-gray-500"
                                }`}
                              >
                                {currency}
                              </span>
                              <input
                                type="text"
                                value={formatWithCustomCommas(calculateTotal())}
                                readOnly
                                className={`w-full border-2 px-3 py-2 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-1 ${
                                  calculateTotal() === 0
                                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:ring-[#35AF87] focus:border-[#35AF87]"
                                } transition-colors duration-200`}
                              />
                            </div>
                            {calculateTotal() === 0 && (
                              <p className="text-red-500 text-left text-xs mt-1 font-medium">
                                No cash detected
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="ml-4">
                          <div
                            className={`flex flex-col justify-end relative ${"2xl:flex xl:flex lg:block md:block"}`}
                          >
                            <label className="mb-2 text-left">
                              Cash Variance
                            </label>
                            <div className="relative w-[170px]">
                              <span className="absolute rounded-l-lg left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                                {currency}
                              </span>
                              <input
                                type="text"
                                value={formatWithCustomCommas(
                                  Math.max(
                                    0,
                                    cashPaymentAmount +
                                      cashHandIn -
                                      calculateTotal()
                                  )
                                )}
                                readOnly
                                className="w-full border border-gray-300 px-3 py-2 pl-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#35AF87]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="ml-4 md:hidden lg:hidden xl:block 2xl:block">
                          <div className="p-2 m-2 w-[65px] h-[63px] pb-2 border bg-[#1A5B63] rounded-[10px] flex items-center justify-center">
                            <button onClick={toggleCalculator}>
                              <img
                                className="w-[45px] h-[45px]"
                                src={Cal}
                                alt="Calculator"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex mt-2 ml-5">
                      <button
                        className="px-4 py-3 mr-2 bg-gray-500 text-white rounded-md"
                        onClick={() => handleRegisterReportClose(setIsPopupOpen)}
                      >
                        Cancel
                      </button>

                      <button
                        className="px-4 py-3 button-bg-color text-white rounded-md"
                        onClick={async () => {
                          console.log("POS closed");
                          try {
                            await handlePOSClose();
                          } catch (error) {
                            console.error("Failed to fetch Z records:", error);
                          }
                        }}
                      >
                        Close the POS
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-2 m-2 w-[65px] h-[65px]  border bg-[#1A5B63] rounded-[10px] flex items-center justify-center">
                <button className="" onClick={handleFullScreen}>
                  <img className="w-[45px] h-[45px]" src={Full} alt="" />
                </button>
              </div>

              <div className="p-2 m-2 w-[65px] h-[65px] pb-2 border bg-[#1A5B63] rounded-[10px] flex items-center justify-center">
                <button onClick={toggleCalculator}>
                  <img className="w-[45px] h-[45px]" src={Cal} alt="Calculator" />
                </button>
              </div>

              <div className="p-2 m-2 w-[65px] h-[65px]  pb-2 border bg-[#1A5B63]  rounded-[10px] flex items-center justify-center">
                <button
                  onClick={() => setIsExitingPopupOpen(true)}
                  className="focus:outline-none"
                >
                  <img className="w-[45px] h-[45px]" src={Back} alt="Back" />
                </button>
              </div>
              {/* The Popup modal */}
              {isExitingPopupOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white w-[400px] h-[240px] p-6 rounded-md shadow-lg">
                    <h2 className="text-xl text-gray-700 font-semibold">
                      Exiting POS
                    </h2>
                    <p>Do you want to exit without closing the POS?</p>
                    <div className="flex mt-4">
                      {/* Cancel button */}
                      <button
                        className="px-4 py-2 mr-2 bg-gray-500 text-white rounded-md"
                        onClick={() =>
                          handleExitingPopupClose(setIsExitingPopupOpen)
                        }
                      >
                        Cancel
                      </button>
                      {/* Confirm button */}
                      <button
                        className="px-4 py-2 button-bg-color text-white rounded-md"
                        onClick={handleExitingFromPos}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN BODY SECTION */}
        {/* Produc billing section in right */}
        <div className="flex justify-between mt-2 w-full h-screen ">
          <div className="w-[35%] h-screen rounded-[15px] bg-white p-2">
            <div>
              <BillingSection
                productBillingHandling={productBillingHandling}
                setProductBillingHandling={setProductBillingHandling}
                handleDeleteHoldProduct={handleDeleteHoldProduct}
                setProductData={setProductData}
                selectedCustomer={selectedCustomer}
                selectedCustomerName={selectedCustomerName}
                selectedCustomerData={selectedCustomerData}
                setSelectedCustomer={setSelectedCustomer}
                setSelectedCustomerName={setSelectedCustomerName}
                setSelectedCustomerData={setSelectedCustomerData}
                warehouse={warehouse}
                setReloadStatus={setReloadStatus}
                setHeldProductReloading={setHeldProductReloading}
                setSelectedCategoryProducts={setSelectedCategoryProducts}
                setSelectedBrandProducts={setSelectedBrandProducts}
                setSearchedProductData={setSearchedProductData}
                setError={setError}
                setFetchRegData={setFetchRegData}
              />
            </div>
          </div>

          <div className="w-[64.8%] ml-2 rounded-[15px] h-screen bg-white ">
            
            {/* Brands selection section */}
            <ProductFilters setFilters={setFilters} setLoading={setLoading} />

            <div className="h-32 sm:mt-40 md:mt-0 xl:mt-0 xxl:mt-0">
              {/* Brands selection section */}
              <div
                id="brands-scroll-container"
                className="flex space-x-2 overflow-x-scroll scrollbar-hide smooth-scroll my-2 mx-2"
                onWheel={(e) =>
                  handleHorizontalScroll(e, "brands-scroll-container")
                }
              >
                <div className="flex space-x-2">
                  {/* All Brands Button */}
                  <button
                    onClick={() => {
                      setSelectedBrand(null);
                      setShowServicesData(false);
                      if (warehouse) {
                        fetchProductDataByWarehouse(
                          warehouse,
                          setProductData,
                          setSelectedCategoryProducts,
                          setSelectedBrandProducts,
                          setSearchedProductData,
                          setLoading
                        );
                      }
                    }}
                    className={`p-2.5 rounded-lg px-4 flex-shrink-0 flex flex-col items-center justify-center transition-colors ${
                      selectedBrand === null && !showServicesData
                        ? "custom text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <h3 className="text-center text-m font-medium">All Brands</h3>
                  </button>

                  {loading ? (
                    <Box
                      sx={{
                        width: "100%",
                        position: "absolute",
                        top: "0",
                        left: "0",
                        margin: "0",
                        padding: "0",
                      }}
                    >
                      <LinearProgress />
                    </Box>
                  ) : (
                    <>
                      {/* Show first 5 brands */}
                      {filters.brands.slice(0, 5).map((b) => (
                        <button
                          key={b._id}
                          onClick={() => {
                            setSelectedBrand(b.brandName);
                            setShowServicesData(false);
                            fetchBrandData(
                              b.brandName,
                              setSelectedBrandProducts,
                              setSelectedCategoryProducts,
                              setSearchedProductData,
                              setProgress
                            );
                          }}
                          className={`flex-shrink-0 border border-gray-200 rounded-lg px-4 flex flex-col items-center justify-center hover:shadow-md ${
                            selectedBrand === b.brandName
                              ? "custom text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          <h3 className="text-center text-m font-medium">
                            {b.brandName}
                          </h3>
                        </button>
                      ))}

                      {/* More button if there are more than 5 brands */}
                      {filters.brands.length > 5 && (
                        <button
                          onClick={() => setShowBrandPopup(true)}
                          className="flex-shrink-0 border border-gray-300 rounded-lg px-4 py-2.5 flex flex-col items-center justify-center hover:shadow-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          <h3 className="text-center text-m font-medium">
                            More...
                          </h3>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Brand Popup Modal */}
              {showBrandPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white w-[600px] max-h-[80vh] p-6 rounded-md shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-700">
                        Select Brand
                      </h2>
                      <button
                        onClick={() => setShowBrandPopup(false)}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    {/* Scrollable grid container - Fixed height to show all brands */}
                    <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-2 gap-3">
                        {filters.brands.map((b) => (
                          <button
                            key={b._id}
                            onClick={() => {
                              setSelectedBrand(b.brandName);
                              setShowServicesData(false);
                              fetchBrandData(
                                b.brandName,
                                setSelectedBrandProducts,
                                setSelectedCategoryProducts,
                                setSearchedProductData,
                                setProgress
                              );
                              setShowBrandPopup(false);
                            }}
                            className={`p-3 border border-gray-200 rounded-lg flex items-center justify-center hover:shadow-md transition-colors h-16 ${
                              selectedBrand === b.brandName
                                ? "custom text-white"
                                : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            <h3 className="text-center text-sm font-medium">
                              {b.brandName}
                            </h3>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Footer with close button */}
                    <div className="flex justify-end mt-4 pt-2 border-t">
                      <button
                        onClick={() => setShowBrandPopup(false)}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Category selection section */}
              <div
                id="categories-scroll-container"
                className="flex space-x-2 overflow-x-scroll scrollbar-hide smooth-scroll mx-2 my-4 pt-1"
                onWheel={(e) =>
                  handleHorizontalScroll(e, "categories-scroll-container")
                }
              >
                <div className="flex space-x-2">
                  {/* All Categories Button */}
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setShowServicesData(false);
                      if (warehouse) {
                        fetchProductDataByWarehouse(
                          warehouse,
                          setProductData,
                          setSelectedCategoryProducts,
                          setSelectedBrandProducts,
                          setSearchedProductData,
                          setLoading
                        );
                      }
                    }}
                    className={`p-2.5 rounded-lg px-4 flex-shrink-0 flex flex-col items-center justify-center transition-colors ${
                      selectedCategory === null && !showServicesData
                        ? "custom text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <h3 className="text-center text-m font-medium">All Categories</h3>
                  </button>

                  {loading ? (
                    <Box
                      sx={{
                        width: "100%",
                        position: "absolute",
                        top: "0",
                        left: "0",
                        margin: "0",
                        padding: "0",
                      }}
                    >
                      <LinearProgress />
                    </Box>
                  ) : (
                    <>
                      {/* Show first 5 categories */}
                      {filters.categories.slice(0, 5).map((c) => (
                        <button
                          key={c._id}
                          onClick={() => {
                            setSelectedCategory(c.category);
                            setShowServicesData(false);
                            fetchCategoryData(
                              c.category,
                              setSelectedCategoryProducts,
                              setSelectedBrandProducts,
                              setSearchedProductData,
                              setProgress
                            );
                          }}
                          className={`flex-shrink-0 border border-gray-200 rounded-lg px-4 flex flex-col items-center justify-center hover:shadow-md ${
                            selectedCategory === c.category
                              ? "custom text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          <h3 className="text-center text-m font-medium">
                            {c.category}
                          </h3>
                        </button>
                      ))}

                      {/* More button if there are more than 5 categories */}
                      {filters.categories.length > 5 && (
                        <button
                          onClick={() => setShowCategoryPopup(true)}
                          className="flex-shrink-0 border border-gray-300 rounded-lg px-4 py-2.5 flex flex-col items-center justify-center hover:shadow-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          <h3 className="text-center text-m font-medium">
                            More...
                          </h3>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

            {/* Category Popup Modal */}
            {showCategoryPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white w-[600px] max-h-[80vh] p-6 rounded-md shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">
                      Select Category
                    </h2>
                    <button
                      onClick={() => setShowCategoryPopup(false)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {/* Scrollable grid container - Fixed height to show approximately 10 categories */}
                  <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-3">
                      {filters.categories.map((c) => (
                        <button
                          key={c._id}
                          onClick={() => {
                            setSelectedCategory(c.category);
                            fetchCategoryData(
                              c.category,
                              setSelectedCategoryProducts,
                              setSelectedBrandProducts,
                              setSearchedProductData,
                              setProgress
                            );
                            setShowCategoryPopup(false);
                          }}
                          className={`p-3 border border-gray-200 rounded-lg flex items-center justify-center hover:shadow-md transition-colors h-16 ${
                            selectedCategory === c.category
                              ? "custom text-white"
                              : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <h3 className="text-center text-sm font-medium">
                            {c.category}
                          </h3>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer with close button */}
                  <div className="flex justify-end mt-4 pt-2 border-t">
                    <button
                      onClick={() => setShowCategoryPopup(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
            

            {/* Product data display section */}
            {progress ? (
              <div
                className="grid gap-y-2 gap-x-1 sm:gap-y-3 sm:gap-x-2 md:gap-y-4 md:gap-x-2 lg:gap-y-4 lg:gap-x-3 xl:gap-y-4 xl:gap-x-4 px-[10px] bg-white"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(176px, 1fr))",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    position: "absolute",
                    top: "0",
                    left: "0",
                    margin: "0",
                    padding: "0",
                  }}
                >
                  <LinearProgress />
                </Box>
                {Array(20)
                  .fill()
                  .map((_, index) => (
                    <div key={index} className="w-[176px] rounded-[15px]">
                      <Skeleton
                        height={176}
                        width={176}
                        className="rounded-[15px]"
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="xl:h-[500px] 2xl:h-[700px] lg:h-[600px] md:h-[500px] overflow-y-scroll">
                {!selectedWarehouseAccess && !showServicesData ? (
                  <p className="text-center mt-5 text-gray-700">
                    You don't have access to this warehouse.
                  </p>
                ) : combinedProductData.length > 0 ? (
                  <div
                    className="grid px-[10px] bg-white sm:gap-x-2 sm:gap-y-3 md:gap-x-2 md:gap-y-4 lg:gap-x-2 lg:gap-y-4 xl:gap-x-2 xl:gap-y-4 2xl:gap-x-6 2xl:gap-y-6"
                    style={{
                      gridTemplateColumns: `repeat(auto-fill, minmax(176px, 1fr))`,
                    }}
                  >
                    {(
                     showServicesData
                       ? (searchedServiceData.length > 0 ? searchedServiceData : combinedProductData)
                       : (searchedProductDataByName.length > 0 ? searchedProductDataByName : combinedProductData)
                    ).map((p) => {
                      const warehouseName = p.warehouse
                        ? Object.keys(p.warehouse)[0]
                        : null;
                      const warehouseData = warehouseName
                        ? p.warehouse[warehouseName]
                        : null;
                      const isSelectable = p.isService ? true : canSelectProduct(warehouseName);

                      const productQtyForSelectedWarehouse = p.isService 
                        ? 999999 
                        : getQtyForSelectedWarehouse(p, warehouse);
                      
                      const isInBill = productBillingHandling.some(item => item.id === p._id);
                      
                      return (
                        <div
                          key={p._id}
                          className={`shadow-md hover:shadow-lg w-[176px] h-[176px] border rounded-lg p-4 flex flex-col items-center ${
                            p.isService 
                              ? (isInBill ? "border-green-400 bg-green-50" : "border-blue-300 bg-blue-50")
                              : "border-gray-200"
                          } ${
                            isSelectable
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-50"
                          }`}
                          onClick={
                            isSelectable
                              ? () => {
                                  playSound();
                                  handleAddingProduct({
                                    id: p._id,
                                    name: p.name,
                                    price: p.isService 
                                      ? (p.price && Array.isArray(p.price) 
                                          ? p.price[0]?.price || 0 
                                          : getPriceRange(p))
                                      : getPriceRange(p),
                                    productCost: getProductCost(p),
                                    stokeQty: warehouseData
                                      ? warehouseData.productQty || getQty(p)
                                      : 0,
                                    taxType: p.taxType || "exclusive",
                                    tax: getTax(p),
                                    discount: getDiscount(p),
                                    ptype: p.ptype,
                                    warranty: p.warranty,
                                    warehouse: p.warehouse || {},
                                    variation: p.variation,
                                    variationType: p.variationType || "Unknown",
                                    variationValues: warehouseData
                                      ? warehouseData.variationValues || {}
                                      : {},
                                    wholesaleEnabled:
                                      warehouseData?.wholesaleEnabled || false,
                                    wholesaleMinQty:
                                      warehouseData?.wholesaleMinQty || 0,
                                    wholesalePrice:
                                      warehouseData?.wholesalePrice || 0,
                                    isService: p.isService || false,
                                  });
                                }
                              : undefined
                          }
                        >
                          <img
                            src={p.isService 
                              ? ProductIcon
                              : (p.image || ProductIcon)
                            }
                            alt={p.name}
                            className="w-[62px] h-[62px] object-cover rounded-md mt-1"
                            style={p.isService && isInBill ? { filter: 'brightness(0)' } : {}}
                          />
                          <h3
                            className="mt-1 text-center text-m font-medium text-gray-900 text-[13px] truncate w-full"
                            title={p.name}
                          >
                            {p.name}
                          </h3>
                          <p
                            className="text-center text-xs text-gray-600 truncate w-full"
                            title={p.code}
                          >
                            {p.code}
                          </p>
                          <div className="flex space-between items-center text-left mt-[2px]">
                            <p className="bg-blue-600 mr-1 text-left px-1 py-[1.5px] rounded-[5px] text-center text-[11px] text-white">
                              {p.isService ? "Available" : `${productQtyForSelectedWarehouse} ${p.saleUnit}`}
                            </p>
                            <p className="bg-blue-400 px-2 py-[1.5px] rounded-[5px] text-center text-[11px] text-white">
                              {currency +
                                " " +
                                (p.isService
                                  ? formatWithCustomCommas(p.price && Array.isArray(p.price) ? p.price[0]?.price || 0 : 0)
                                  : formatWithCustomCommas(getPriceRange(p)))}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : showServicesData ? (
                  <p className="text-center mt-5 text-gray-700">
                    No services available.
                  </p>
                ) : (
                  <p className="text-center mt-5 text-gray-700">
                    You don't have access to this warehouse.
                  </p>
                )}
              </div>
            )}

            {/* VARIATION */}
            <div>
              {selectVariation && (
                <ProductVariationModal
                  selectedProduct={selectedProduct}
                  setSelectVariation={setSelectVariation}
                  productBillingHandling={productBillingHandling}
                  setProductBillingHandling={setProductBillingHandling}
                  setProductKeyword={setProductKeyword}
                  inputRef={inputRef}
                />
              )}
            </div>

            <LoadingOverlay />

            {/* CALCULATOR */}
            {showCalculator && (
              <Draggable>
                <div className="fixed top-0 right-0 p-4 z-50 rounded-lg">
                  <Calculator />
                  <button
                    onClick={toggleCalculator}
                    className="flex relative bottom-[95px] mt-5 ml-12 mt-4 bg-gray-200 p-2 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </Draggable>
            )}
          </div>
        </div>

        {/* Services Popup Modal */}
        <ServicesPopupModal
          isOpen={isServicesPopupOpen}
          onClose={() => setIsServicesPopupOpen(false)}
          services={services}
          onServiceSelect={handleAddingProduct}
          warehouse={warehouse}
          currency={currency}
        />

        <div>
          {errorMessage && (
            <p className="button-bg-color mt-5 text-center">{errorMessage}</p>
          )}
        </div>
      </div>
    );
  }
  export default PosSystemBody;
