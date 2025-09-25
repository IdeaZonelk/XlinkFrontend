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

/* import axios from 'axios';
import { debounce } from 'lodash';

export const handleFindServiceBySearch = (e, setServiceKeyword, handleServiceSubmit) => {
  const keyword = e.target.value;
  setServiceKeyword(keyword);
  handleServiceSubmit(keyword);
};

export const determineSearchTypeOfService = (keyword) => {
  if (/^SRV-[0-9]+$/.test(keyword)) {
    return 'code';
  }
  return 'name';
};

export const handleServiceSubmit = async (serviceKeyword, setLoading, setSearchedServiceData, warehouse) => {
  if (!serviceKeyword || serviceKeyword.trim() === '') {
    setSearchedServiceData([]);
    setLoading(false);
    return;
  }

  setLoading(true);
  try {
    const searchType = determineSearchTypeOfService(serviceKeyword);
    const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchService`, {
      params: { 
        keyword: serviceKeyword.trim(),
        searchType
      }
    });

    if (response.data && response.data.services && Array.isArray(response.data.services)) {
      console.log('Services found:', response.data.services);
      
      const transformedServices = response.data.services.map(service => {
        const calculateServiceFinalPrice = (service) => {
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

      setSearchedServiceData(transformedServices);
    } else {
      console.log('No services found for the given keyword');
      setSearchedServiceData([]);
    }
  } catch (error) {
    console.error('Find service error:', error.response?.data || error);
    setSearchedServiceData([]);
  } finally {
    setLoading(false);
    console.log('Service search completed');
  }
};

export const debouncedServiceSearch = debounce(async (searchTerm, setServices, setLoading, setError, warehouse) => {
  await handleServiceSubmit(searchTerm, setLoading, setServices, warehouse);
}, 300);

export const searchServicesByName = async (keyword, setLoading, setSearchedServiceData, warehouse) => {
  if (!keyword || keyword.trim() === '') {
    setSearchedServiceData([]);
    setLoading(false);
    return;
  }

  setLoading(true);
  try {
    const searchType = determineSearchTypeOfService(keyword);
    const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchService`, {
      params: { 
        keyword: keyword.trim(),
        searchType
      }
    });

    if (response.data.services && Array.isArray(response.data.services)) {
      const transformedServices = response.data.services.map(service => {
        const calculateServiceFinalPrice = (service) => {
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

      console.log('Services search result:', transformedServices);
      setSearchedServiceData(transformedServices);
    } else {
      setSearchedServiceData([]);
    }
  } catch (error) {
    console.error('Service search error:', error.response?.data || error);
    setSearchedServiceData([]);
  } finally {
    setLoading(false);
  }
}; */