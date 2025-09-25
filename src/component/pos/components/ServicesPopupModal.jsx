import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Settings } from 'lucide-react';
import axios from 'axios';

const ServicesPopupModal = ({ 
  isOpen, 
  onClose, 
  services, 
  onServiceSelect, 
  warehouse, 
  currency = "Rs" 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize filtered services with all services
  useEffect(() => {
    console.log('Initializing services in modal:', services.length, 'services loaded');
    console.log('Services data:', services);
    setFilteredServices(services);
  }, [services]);

  // Handle search with backend API call
  useEffect(() => {
    const handleSearch = async () => {
      if (searchTerm.trim() === "") {
        // Show all services when search is empty
        setFilteredServices(services);
        return;
      }

      setLoading(true);
      try {
        console.log('Searching services with term:', searchTerm);
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/searchService`, {
          params: { 
            serviceName: searchTerm.trim(),
            keyword: searchTerm.trim() 
          }
        });

        console.log('Service search response:', response.data);

        if (response.data.status === 'success' && Array.isArray(response.data.services)) {
          const transformedServices = response.data.services.map(service => ({
            ...service,
            // Ensure we have the proper structure for display
            serviceName: service.serviceName || service.name,
            finalPrice: service.finalPrice || 0
          }));
          
          console.log('Transformed search results:', transformedServices);
          setFilteredServices(transformedServices);
        } else {
          console.log('No services found or invalid response');
          setFilteredServices([]);
        }
      } catch (error) {
        console.error('Service search error:', error);
        setFilteredServices([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, services]);

  const handleServiceClick = (service) => {
    console.log('Service clicked:', service);
    
    // Use the final price from the service data (which comes from backend calculation)
    // or calculate it if not available
    const getFinalPrice = (service) => {
      console.log('Getting final price for service:', service);
      
      // Check if service has finalPrice from backend
      if (service.finalPrice !== undefined) {
        console.log('Using backend finalPrice:', service.finalPrice);
        return parseFloat(service.finalPrice);
      }

      // Check if service has price array from POS transformation
      if (service.price && Array.isArray(service.price) && service.price[0]) {
        console.log('Using price array:', service.price[0].price);
        return parseFloat(service.price[0].price);
      }

      // Fallback: calculate final price
      let finalPrice = parseFloat(service.price) || 0;
      let taxAmount = 0;
      let discountAmount = 0;

      console.log('Calculating final price from base price:', finalPrice);

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
      const calculatedPrice = Math.max(0, finalPrice);
      console.log('Calculated final price:', calculatedPrice);
      return calculatedPrice;
    };

    const finalCalculatedPrice = getFinalPrice(service);

    // Transform service to match product format for billing
    const serviceForBilling = {
      id: service._id,
      name: service.serviceName,
      code: `SRV-${service._id.slice(-6)}`,
      price: finalCalculatedPrice,
      originalPrice: service.price || 0,
      originalTax: service.orderTax || 0,
      originalDiscount: service.discount || 0,
      taxType: service.taxType || 'exclusive',
      tax: 0, // Tax already applied in price calculation
      discount: 0, // Discount already applied in price calculation
      stokeQty: 999999,
      productQty: 999999,
      ptype: 'simple',
      isService: true,
      saleUnit: 'Service',
      warehouse: {
        [warehouse || 'default']: {
          productPrice: finalCalculatedPrice,
          productQty: 999999,
          orderTax: service.orderTax || 0,
          discount: service.discount || 0,
          taxType: service.taxType || 'exclusive',
          variationValues: {},
          wholesaleEnabled: false,
          wholesaleMinQty: 0,
          wholesalePrice: 0,
          productCost: finalCalculatedPrice
        }
      }
    };

    onServiceSelect(serviceForBilling);
    onClose(); // Close modal after selection
  };

  const formatWithCommas = (number) => {
    return new Intl.NumberFormat('en-US').format(number || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white w-[90%] max-w-6xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
  <div className="bg-[#44BC8D] text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            <h2 className="text-2xl font-semibold">Select Service</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search services by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>

        {/* Services Grid */}
        <div className="p-6 overflow-y-auto h-[calc(85vh-200px)]">
          {(() => {
            console.log('Rendering services grid:', {
              loading,
              filteredServicesLength: filteredServices.length,
              filteredServices: filteredServices
            });
            return null;
          })()}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredServices.map((service) => {
                // Calculate display price - use backend finalPrice if available
                const calculateDisplayPrice = () => {
                  console.log('Calculating display price for service:', service);
                  
                  // Check if service has finalPrice from backend
                  if (service.finalPrice !== undefined) {
                    console.log('Using backend finalPrice for display:', service.finalPrice);
                    return parseFloat(service.finalPrice);
                  }

                  // Check if service has price array from POS transformation
                  if (service.price && Array.isArray(service.price) && service.price[0]) {
                    console.log('Using price array for display:', service.price[0].price);
                    return parseFloat(service.price[0].price);
                  }

                  // Fallback: calculate final price
                  let price = parseFloat(service.price) || 0;
                  let taxAmount = 0;
                  let discountAmount = 0;

                  console.log('Calculating display price from base:', price);

                  if (service.orderTax && parseFloat(service.orderTax) > 0) {
                    if (service.taxType === 'percentage') {
                      taxAmount = (price * parseFloat(service.orderTax)) / 100;
                    } else {
                      taxAmount = parseFloat(service.orderTax);
                    }
                  }

                  if (service.discount && parseFloat(service.discount) > 0) {
                    if (service.discountType === 'percentage') {
                      discountAmount = (price * parseFloat(service.discount)) / 100;
                    } else {
                      discountAmount = parseFloat(service.discount);
                    }
                  }

                  const calculatedPrice = Math.max(0, price + taxAmount - discountAmount);
                  console.log('Final calculated display price:', calculatedPrice);
                  return calculatedPrice;
                };

                const displayPrice = calculateDisplayPrice();

                return (
                  <div
                    key={service._id}
                    onClick={() => handleServiceClick(service)}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 bg-gradient-to-b from-white to-gray-50"
                  >
                    {/* Service Icon */}
                    <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                      <Settings className="w-8 h-8 text-blue-600" />
                    </div>
                    {/* Service Name */}
                    <h3 
                      className="text-center text-sm font-medium text-gray-900 mb-2 truncate"
                      title={service.serviceName}
                    >
                      {service.serviceName}
                    </h3>
                    {/* Service Description */}
                    {service.description && (
                      <p 
                        className="text-center text-xs text-gray-600 mb-2 line-clamp-2 px-1"
                        title={service.description}
                      >
                        {service.description}
                      </p>
                    )}
                    {/* Price and Status */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                        Available
                      </span>
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                        {currency} {formatWithCommas(displayPrice.toFixed(2))}
                      </span>
                    </div>
                    {/* Add Button Overlay */}
                    <div className="mt-2 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="bg-blue-600 text-white rounded-md p-1 text-center text-xs flex items-center justify-center gap-1">
                        <Plus className="w-3 h-3" />
                        Add to Bill
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No services found matching your search.' : 'No services available.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-between items-center bg-gray-50">
          <p className="text-sm text-gray-600">
            {loading ? (
              'Searching...'
            ) : searchTerm ? (
              `${filteredServices.length} service${filteredServices.length !== 1 ? 's' : ''} found matching "${searchTerm}"`
            ) : (
              `${filteredServices.length} service${filteredServices.length !== 1 ? 's' : ''} available`
            )}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicesPopupModal;