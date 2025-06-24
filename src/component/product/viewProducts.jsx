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

import { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import PaginationDropdown from "../utill/Pagination";
import { toast } from "react-toastify";
import ConfirmationModal from "../common/deleteConfirmationDialog";
import ProductIcon from "../../img/product icon.jpg";
import formatWithCustomCommas from '../utill/NumberFormate';
import { useCurrency } from '../../context/CurrencyContext';
import { UserContext } from "../../context/UserContext";
import * as XLSX from "xlsx";

function ViewProductsBody() {
  // State variables
  const [productData, setProductData] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [searchedProduct, setSearchedProduct] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);  // State for controlling modal visibility
  const [productToDelete, setProductToDelete] = useState(null);
  const debounceTimeout = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { currency } = useCurrency()
  const [permissionData, setPermissionData] = useState({});
  const { userData } = useContext(UserContext);
  // State for Modify Products Modal
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelError, setExcelError] = useState('');
  const [excelProgress, setExcelProgress] = useState(false);

  useEffect(() => {
    if (userData?.permissions) {
      console.log("UserData received in useEffect:", userData);

      setPermissionData(extractPermissions(userData.permissions));
    }
  }, [userData]);


  const fetchUnitData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/api/findAllProduct`,
        {
          params: {
            sort: "-createdAt",
            "page[size]": size,  // Ensure correct parameter format
            "page[number]": page, // Ensure correct parameter format
          },
        }
      );

      // Handle the response format with 'products' key
      if (response.data && Array.isArray(response.data.products)) {
        console.log("Product data:", response.data.products);
        setProductData(response.data.products);
        setSearchedProduct(response.data.products);
        setTotalPages(response.data.totalPages || 1); // Default to 1 if undefined
        setKeyword('');
      } else {
        console.error("Unexpected response format:", response.data);
        setProductData([]);
        setSearchedProduct([]);
        setError("Failed to load products. Please try again later.");
      }
    } catch (error) {
      console.error("Fetch product data error:", error);
      setProductData([]);
      setSearchedProduct([]);
      setError("No products found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (keyword.trim() === '') {
      fetchUnitData();
    }
  }, [keyword, page, size, refreshKey]);

  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  // Handle delete unit from full list
  const handleDelete = async (_id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BASE_URL}/api/deleteProduct/${_id}`
      );
      setProductData(productData.filter((p) => p._id !== _id));
      toast.success(
        "Product deleted successfully!",
        { autoClose: 2000 },
        { className: "custom-toast" }
      );
      setRefreshKey(prevKey => prevKey + 1);
      fetchUnitData();
    } catch (error) {
      console.error("Delete product error:", error);
      toast.error("Error deleting product!", { autoClose: 2000 });
    }
  };

  const showConfirmationModal = (productId) => {
    setProductToDelete(productId);
    setIsModalOpen(true);
  };

  const searchProduct = async (query) => {
    setLoading(true);
    setError(""); // Clear any previous error messages

    try {
      if (!query.trim()) {
        // If the query is empty, reset to all products
        setSearchedProduct(productData); // Reset to the initial list
        setResponseMessage("");
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchProduct`, {
        params: { keyword: query }, // Send the keyword parameter
      });

      if (response.data.products && response.data.products.length > 0) {
        setSearchedProduct(response.data.products);
        setResponseMessage("");
      } else {
        setSearchedProduct([]); // Clear the table
        setError("No products found for the given query."); // Set error message
      }
    } catch (error) {
      console.error("Search product error:", error);
      setSearchedProduct([]); // Clear the table
      setError("No products found for the given query.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  }, [searchedProduct]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setKeyword(value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      if (value.trim() === "") {
        setError("");
        setResponseMessage("");
        setSearchedProduct(productData); // Reset to full list
      } else {
        searchProduct(value); // Call the search API with the entered query
      }
    }, 100); // Adjust debounce delay as needed
  };


  // Handle keydown events
  const handleKeyDown = (e) => {
    const value = e.target.value;

    // If backspace is pressed and the input becomes empty, reset the searchedBaseUnits
    if (e.key === 'Backspace' && value === '') {
      setSearchedProduct([]);
    }
  };

  // Handle Excel file upload for bulk modification
  const handleExcelFileChange = (e) => {
    setExcelError('');
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(file.type) && !["xlsx", "xls"].includes(ext)) {
      setExcelError("Only .xlsx and .xls files are allowed.");
      setExcelFile(null);
      return;
    }
    setExcelFile(file);
  };

  // Handle Excel file upload for bulk modification
  const handleExcelImport = async () => {
    setExcelError('');
    setExcelProgress(true);

    if (!excelFile) {
      setExcelError("Please select an Excel file.");
      setExcelProgress(false);
      return;
    }

    try {
      // 1. Read Excel
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      // 2. Validate columns
      const requiredFields = ["Product code", "Brand", "Product Cost", "Product Price"]; // Removed "Images"
      const missingFields = requiredFields.filter(f => !Object.keys(rows[0] || {}).includes(f));
      if (missingFields.length > 0) {
        setExcelError(`Please check Excel sheet fields: Missing ${missingFields.join(", ")}`);
        setExcelProgress(false);
        return;
      }

      // 3. Fetch all brands for validation
      const brandsRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findBrand`);
      const allBrands = (brandsRes.data?.brands || []).map(b => b.brandName);

      // 4. For each row, update product
      for (const row of rows) {
        // a. Get product by code
        const code = row["Product code"];
        let productRes;
        try {
          productRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findProductByCode/${code}`);
        } catch {
          setExcelError(`Product with code "${code}" not found.`);
          setExcelProgress(false);
          return;
        }
        const product = productRes.data?.product;
        if (!product) {
          setExcelError(`Product with code "${code}" not found.`);
          setExcelProgress(false);
          return;
        }

        // b. Brand check
        const newBrand = row["Brand"];
        if (!allBrands.includes(newBrand)) {
          setExcelError(`Brand "${newBrand}" does not exist. Please create the brand first.`);
          setExcelProgress(false);
          return;
        }

        // c. Prepare FormData for update
        const formData = new FormData();
        formData.append("brand", newBrand);
        formData.append("productCost", row["Product Cost"]);
        formData.append("productPrice", row["Product Price"]);



        // e. Call backend update endpoint (you may need to create a dedicated endpoint for partial update)
        await axios.put(
          `${process.env.REACT_APP_BASE_URL}/api/updateProductFields/${product._id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      toast.success("Products successfully modified!", { autoClose: 2000 });
      setShowModifyModal(false);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setExcelError("Failed to process the file. Please ensure the format is correct.");
      console.error(err);
    } finally {
      setExcelProgress(false);
    }
  };

  const getPriceRange = (product) => {
    const prices = [];

    if (product.warehouse) {
      for (const warehouseKey in product.warehouse) {
        const warehouse = product.warehouse[warehouseKey];
        if (warehouse.variationValues) {
          for (const variationKey in warehouse.variationValues) {
            const variation = warehouse.variationValues[variationKey];
            const price = Number(variation.productPrice);
            if (!isNaN(price)) {
              prices.push(price);
            }
          }
        } else {
          const price = Number(warehouse.productPrice);
          if (!isNaN(price)) {
            prices.push(price);
          }
        }
      }
    }

    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // If all prices are the same, return the single price
      if (minPrice === maxPrice) {
        return `${minPrice}`;
      } else {
        return `${minPrice} - ${maxPrice}`;
      }
    }

    // Fallback to single product price if no variations are available
    const singlePrice = Number(product.productPrice);
    if (!isNaN(singlePrice) && singlePrice > 0) {
      return `${singlePrice}`;
    }
    return "Price not available"; // Default case when no price is found
  };

  // Calculate price range (min and max) for products with variations
  const getQty = (product) => {
    const qty = [];

    if (product.warehouse) {
      for (const warehouseKey in product.warehouse) {
        const warehouse = product.warehouse[warehouseKey];
        if (warehouse.variationValues) {
          for (const variationKey in warehouse.variationValues) {
            const variation = warehouse.variationValues[variationKey];
            const quantity = Number(variation.productQty);
            if (!isNaN(quantity)) {
              qty.push(quantity);
            }
          }
        } else {
          const quantity = Number(warehouse.productQty);
          if (!isNaN(quantity)) {
            qty.push(quantity);
          }
        }
      }
    }

    if (qty.length > 0) {
      return qty.reduce((total, current) => total + current, 0);
    }

    // Fallback to single product quantity if no variations are available
    const singleProductQty = Number(product.productQty);
    return !isNaN(singleProductQty) && singleProductQty > 0
      ? singleProductQty
      : 0;
  };

  // Show the popup with selected product
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowPopup(true);
  };

  // Close the popup
  const closePopup = () => {
    setShowPopup(false);
    setSelectedProduct(null);
  };

  // Render variation details
  const renderWarehouseDetails = (warehouses) => {
    if (!warehouses || Object.keys(warehouses).length === 0) {
      return <p className="text-gray-700 ">No Warehouses</p>;
    }
    return Object.entries(warehouses).map(([warehouseKey, warehouseValue]) => (
      <div className="mt-10">
        <div>
          <h3 className="text-left ml-5 text-gray-800 py-2 px-4 rounded-t-md bg-gray-200 inline-block z-10 relative">
            <p className="text-gray-700">{warehouseValue.warehouseName || warehouseKey}</p>
          </h3>
        </div>
        <div key={warehouseKey} className="ml-5 border p-5 py-4 rounded-tr-md rounded-b-md border-2 border-gray-200 inline-block">
          {warehouseValue.variationValues ? (
            renderVariationDetails(warehouseValue.variationValues)
          ) : (
            renderSingleProductDetails(warehouseValue)
          )}
        </div>
      </div>
    ));
  };

  const renderVariationDetails = (variationValues) => {
    if (!variationValues || Object.keys(variationValues).length === 0) {
      return <p className="text-gray-700 ">No Variations</p>;
    }
    return Object.entries(variationValues).map(([key, value]) => (
      <div key={key} className="mt-5 ">
        <div className="flex text-gray-700">
          <p className="text-left mr-10">
            <p className="text-left mr-10">Variation Type</p>
            <br /> {key}
          </p>
          <p className="text-left mr-10 ">
            <p className="text-left mr-10">Price</p>
            <br /> {currency} {formatWithCustomCommas(value.productPrice)}
          </p>
          <p className="text-left mr-10">
            <p className="text-left mr-10">Quantity</p>
            <br /> {value.productQty}
          </p>
          <p className="text-left mr-10">
            <p className="text-left mr-10">Code</p> <br />
            {value.code}
          </p>
        </div>
      </div>
    ));
  };

  const renderSingleProductDetails = (warehouseValue) => (
    <div className="">
      <div className="flex text-gray-700">
        <p className="text-left mr-10">
          <p className="text-left mr-10">Product Cost</p> <br />
          {currency} {formatWithCustomCommas(warehouseValue.productCost)}
        </p>
        <p className="text-left mr-10">
          <p className="text-left mr-10">Price</p>
          <br />{currency} {formatWithCustomCommas(warehouseValue.productPrice)}
        </p>
        <p className="text-left mr-10">
          <p className="text-left mr-10">Quantity</p>
          <br /> {warehouseValue.productQty}
        </p>
        <p className="text-left mr-10">
          <p className="text-left mr-10">Alert</p>
          <br /> {warehouseValue.stockAlert}
        </p>
        <p className="text-left mr-10">
          <p className="text-left mr-10">Tax</p> <br />
          {warehouseValue.orderTax} %
        </p>
      </div>
    </div>
  );

  const extractPermissions = (permissions) => {
    let extractedPermissions = {};

    Object.keys(permissions).forEach((category) => {
      Object.keys(permissions[category]).forEach((subPermission) => {
        extractedPermissions[subPermission] = permissions[category][subPermission];
      });
    });

    return extractedPermissions;
  };

  return (
    <div className="relative background-white absolute top-[80px] left-[18%] w-[82%] min-h-[100vh] p-5">
      <div className="flex justify-between mb-4">
        <div className="relative w-full max-w-md">
          <form className="flex items-center">
            <input
              name="keyword"
              type="text"
              placeholder="Search by name or code..."
              className="searchBox w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
              value={keyword}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"
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
            </button>
          </form>
        </div>
        <div className="flex items-center">
          {permissionData.create_product && (
            <div>
              <button
                type="button"
                className="submit mr-2 flex-none rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-40 text-center"                onClick={() => setShowModifyModal(true)}
              >
                Modify Products
              </button>
              <Link
                to={"/createProduct"}
                className="submit flex-none rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-60 text-center"
              >
                Create Product
              </Link>
            </div>
          )}
        </div>
      </div>

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
        </Box>) : error ? (
          <div className=" ">
            {error && (
              <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center inline-block">
                {error}
              </p>
            )}
          </div>
        ) : searchedProduct.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Stock
                  </th>
                  <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created On
                  </th>
                  <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-left">
                {searchedProduct.map((p) => (
                  <tr key={p._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={p.image ? p.image : ProductIcon}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-full"
                      />
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                      {p.name}
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                      {p.code}
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                      {p.brand}
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">{currency}  {' '}
                      {formatWithCustomCommas(getPriceRange(p))}
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                      {p.saleUnit}
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                      {p.productQty ? p.productQty : getQty(p)}
                    </td>
                    <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                      {(p.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      <div className="flex items-center justify-end">
                        {permissionData.view_product && (
                          <button
                            className="text-[#35AF87] hover:text-[#16796E] font-bold py-1 px-2 mr-2 text-lg"
                            onClick={() => handleViewProduct(p)}
                            style={{ background: "transparent" }}
                          >
                            <i className="fas fa-eye mr-1"></i>
                          </button>
                        )}
                        {permissionData.edit_product && (
                          <Link
                            to={`/editProduct/${p._id}`}
                            className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 text-lg"
                            style={{ background: "transparent" }}
                          >
                            <i className="fas fa-edit mr-1"></i>
                          </Link>
                        )}
                        {permissionData.delete_product && (
                          <button
                            onClick={() => showConfirmationModal(p._id)}
                            className="text-red-500 hover:text-red-700 font-bold py-1 px-2 text-lg"
                            style={{ background: "transparent" }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
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
                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In Stock
                </th>
                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created On
                </th>
                <th className="px-7 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productData.map((p) => (
                <tr key={p._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={p.image ? p.image : ProductIcon}
                      alt={p.name}
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                    {p.name}
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                    {p.code}
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                    {p.brand}
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">{currency}
                    {formatWithCustomCommas(getPriceRange(p))}
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                    {p.saleUnit}
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                    {p.productQty ? p.productQty : getQty(p)}
                  </td>
                  <td className="px-7 py-5 whitespace-nowrap text-m text-gray-900 text-left">
                    {p.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div className="flex items-center justify-end">
                      {permissionData.view_product && (
                        <button
                          className="text-[#35AF87] hover:text-[#16796E] font-bold py-1 px-2 mr-2 text-lg"
                          onClick={() => handleViewProduct(p)}
                          style={{ background: "transparent" }}
                        >
                          <i className="fas fa-eye mr-1"></i>
                        </button>
                      )}
                      {permissionData.edit_product && (
                        <Link
                          to={`/editProduct/${p._id}`}
                          className="text-blue-500 hover:text-blue-700 font-bold py-1 px-2 mr-2 text-lg"
                          style={{ background: "transparent" }}
                        >
                          <i className="fas fa-edit mr-1"></i>
                        </Link>
                      )}
                      {permissionData.delete_product && (
                        <button
                          onClick={() => showConfirmationModal(p._id)}
                          className="text-red-500 hover:text-red-700 font-bold py-1 px-2 text-lg"
                          style={{ background: "transparent" }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
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
        onClose={() => setIsModalOpen(false)}  // Close modal
        onConfirm={() => handleDelete(productToDelete)}  // Confirm delete
        message="Are you sure you want to delete this product?"
      />

      {/* Pagination Controls - Visible only when data is loaded */}
      <div>
        {productData.length > 0 && (
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
      {/* Popup for viewing product details */}
      {showPopup && selectedProduct && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
          <div className="bg-white p-8 mt-20 rounded-lg max-h-[80vh] overflow-y-auto shadow-2xl w-[90%] sm:w-2/3 lg:w-1/2 text-gray-800 relative animate-fadeIn scroll-container">
            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-all"
            >
              <img
                className="w-6 h-6"
                src="https://th.bing.com/th/id/OIP.Ej48Pm2kmEsDdVNyEWkW0AHaHa?rs=1&pid=ImgDetMain"
                alt="close"
              />
            </button>

            {/* Flex Container for Details and Image */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Product Details (Left Side) */}
              <div className="flex-1 text-left">
                <div className="border-b pb-4 mb-5 w-full">
                  <h2 className="text-2xl font-bold text-gray-700">
                    Product Details
                  </h2>
                </div>
                <div className="mt-5 space-y-4">
                  <p>
                    <strong className="font-medium">Name:</strong>{" "}
                    <span className="text-gray-600">
                      {selectedProduct.name}
                    </span>
                  </p>
                  <p>
                    <strong className="font-medium">Code:</strong>{" "}
                    <span className="text-gray-600">
                      {selectedProduct.code}
                    </span>
                  </p>
                  <p>
                    <strong className="font-medium">Product Type</strong>{" "}
                    <span className="text-gray-600">
                      {selectedProduct.ptype}
                    </span>
                  </p>
                  <p>
                    <strong className="font-medium">Category:</strong>{" "}
                    <span className="text-gray-600">
                      {selectedProduct.category}
                    </span>
                  </p>
                  <p>
                    <strong className="font-medium">Brand:</strong>{" "}
                    <span className="text-gray-600">
                      {selectedProduct.brand}
                    </span>
                  </p>
                  <p>
                    <strong className="font-medium">Price:</strong>{" "}
                    <span className="text-gray-600">
                      {currency} {formatWithCustomCommas(getPriceRange(selectedProduct))}
                    </span>
                  </p>
                  <p>
                    <strong className="font-medium">Purchase Unit:</strong>{" "}
                    <span className="text-gray-600">
                      {selectedProduct.purchase}
                    </span>
                  </p>
                  <p>
                    <strong className="font-medium">Sale Unit:</strong>{" "}
                    <span className="text-gray-600">
                      {selectedProduct.saleUnit}
                    </span>
                  </p>
                  <p>
                    <strong className="font-medium">In Stock:</strong>{" "}
                    <span className="text-gray-600">
                      {selectedProduct.productQty
                        ? selectedProduct.productQty
                        : getQty(selectedProduct)}
                    </span>
                  </p>
                  <p>
                    <strong className="font-medium">Created On:</strong>{" "}
                    <span className="text-gray-600">
                      {new Date(selectedProduct.date).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Product Image (Right Side) */}
              {selectedProduct.image && (
                <div className="flex-1 flex items-start mt-16 justify-center">
                  <div className="w-full max-w-[150px] h-[150px] mt-5 bg-gray-100 rounded-lg overflow-hidden shadow">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Variation Details */}
            <div className="mt-6 text-left">
              <h3 className="text-lg font-semibold text-gray-800">
                Product Properties
              </h3>
              <div className="mt-3">
                {renderWarehouseDetails(selectedProduct.warehouse)}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modify Products Modal */}
      {showModifyModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40"
            onClick={() => {
              setShowModifyModal(false);
              setExcelError('');
              setExcelFile(null);
            }}
          ></div>

          {/* Centered Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white px-8 py-6 rounded-lg shadow-lg w-[600px] min-h-[400px] overflow-y-auto relative text-center">
              <h2 className="text-xl font-semibold mb-6">Modify Products (Bulk Update)</h2>

              {/* File Input */}
              <div className="mb-8">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelFileChange}
                  className="block mx-auto"
                />
              </div>

              {/* Labels */}
              <div className="text-left space-y-1 mb-10">
                <p className="text-base">Product code : <span className="font-medium text-gray-900">Required</span></p>
                <p className="text-base">Brand : <span className="font-medium text-gray-900">Required</span></p>
                <p className="text-base">Product Cost : <span className="font-medium text-gray-900">Required</span></p>
                <p className="text-base">Product Price : <span className="font-medium text-gray-900">Required</span></p>
              </div>

              {/* Error */}
              {excelError && <p className="text-red-600 mt-4">{excelError}</p>}

              {/* Buttons */}
              <div className="mt-6 flex justify-center gap-4">
                <button
                  className="submit w-40 rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus:outline-none"
                  onClick={handleExcelImport}
                  disabled={excelProgress || !excelFile}
                >
                  {excelProgress ? "Processing..." : "Import & Update"}
                </button>
                <button
                  onClick={() => {
                    setShowModifyModal(false);
                    setExcelError('');
                    setExcelFile(null);
                  }}
                  className="w-[100px] inline-flex justify-center rounded-md bg-gray-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}


    </div>
  );
}

export default ViewProductsBody;
