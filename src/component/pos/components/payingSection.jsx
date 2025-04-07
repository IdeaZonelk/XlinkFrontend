import { useState, useEffect, useRef, } from "react";
import ReactToPrint from "react-to-print";
import PrintInvoice from "./printInvoice";
import { fetchAllData } from "../utils/fetchAllData";
import axios from "axios";
import { handleSave } from '../../sales/SaleController'
import { decryptData } from '../../utill/encryptionUtils';
import { useCurrency } from '../../../context/CurrencyContext';
import formatWithCustomCommas from '../../utill/NumberFormate';

const PayingSection = ({ handlePopupClose, calculateTotalPrice, totalItems, totalPcs, calculateTotalQty, profit, tax, shipping, discount, productDetails, handleBillReset, setSelectedCategoryProducts, setSelectedBrandProducts, setSearchedProductData, setProductData, selectedCustomer, discountType, warehouse, responseMessage, setResponseMessage, setReloadStatus, offerPercentage, grandTotal, setError, setProgress, setSelectedOffer }) => {
    const [receivedAmount, setReceivedAmount] = useState('');
    const [returnAmount, setReturnAmount] = useState('');
    const [paymentType, setPaymentType] = useState('cash');
    const [note, setNote] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('paid');
    const printRef = useRef();
    const [registerData, setRegisterData] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState('')
    const date = new Date().toISOString().split('T')[0];
    const totalPrice = calculateTotalPrice();
    const [decryptedUser, setDecryptedUser] = useState(null);
    const [preFix, setPreFix] = useState('');
    const { currency } = useCurrency();
    const [amounts, setAmounts] = useState({
        cash: '',
        card: '',
        bank_transfer: '',
    });
    const [validationFailed, setValidationFailed] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState(null);

    const handleAmountChange = (type, value) => {
        setAmounts(prevState => {
            const updatedAmounts = {
                ...prevState,
                [type]: value
            };
            console.log("Updated amounts:", updatedAmounts); // Log the updated amounts
            return updatedAmounts;
        });
    };

    const calculateTotalReceivedAmount = () => {
        const { cash, card, bank_transfer } = amounts;
        return parseFloat(cash || 0) + parseFloat(card || 0) + parseFloat(bank_transfer || 0);
    };
    const totalReceivedAmount = calculateTotalReceivedAmount();

    const calculateBalance = () => {
        const totalPrice = parseFloat(calculateTotalPrice()) || 0;
        const totalPaid = Object.values(amounts).reduce((acc, amount) => acc + (parseFloat(amount) || 0), 0);
        const balance = totalPrice - totalPaid;
        return isNaN(balance) ? "0.00" : balance.toFixed(2);
    };

    const validatePaymentStatus = () => {
        const totalPrice = parseFloat(calculateTotalPrice()) || 0;
        const totalPaid = Object.values(amounts).reduce((acc, amount) => acc + (parseFloat(amount) || 0), 0);
        const balance = totalPrice - totalPaid;
        const normalizedPaymentStatus = paymentStatus?.toLowerCase();

        if (normalizedPaymentStatus === 'paid' && balance > 0) {
            alert("Payment status is 'Paid', but there's still a balance remaining. Please adjust the payment amount.");
            setProgress(false);
            setValidationFailed(true); // Set validation failure
            return false;
        }

        setValidationFailed(false); // Reset if validation passes
        return true;
    };

    useEffect(() => {
        const totalAmount = calculateTotalPrice();
        const calculatedReturnAmount = totalReceivedAmount - totalAmount;
        setReturnAmount(calculatedReturnAmount.toFixed(2));
    }, [totalReceivedAmount, calculateTotalPrice]);

    const handlePrintAndClose = () => {
        setReloadStatus(true)
        setReceivedAmount('');
        setReturnAmount('');
        setPaymentType('cash');
        setNote('');
        setPaymentStatus('paid');
        handleBillReset();
        handlePopupClose();
    };

    useEffect(() => {
        const encryptedUser = sessionStorage.getItem('user');
        if (encryptedUser) {
            try {
                const user = decryptData(encryptedUser);
                setDecryptedUser(user);
            } catch (error) {
                console.error('Failed to decrypt user data:', error);
                sessionStorage.removeItem('user');
                alert('Session data corrupted. Please log in again.');
                return;
            }
        } else {
            console.error('User data could not be retrieved');
            alert('Could not retrieve user data. Please log in again.');
        }
    }, []);

    useEffect(() => {
        const fetchSettings = () => {
            if (!decryptedUser) {
                console.error('No decrypted user data available');
                return;
            }
            const preFix = decryptedUser.prefixes?.[0].salePrefix;
            console.log(preFix)
            if (!preFix) {
                console.error('No receipt settings available');
                setError('Receipt settings not found');
                return;
            }
            console.log('Fetched data:', preFix);
            setPreFix(preFix)
        };

        fetchSettings();
    }, [decryptedUser]);


    const updateProductQuantities = async (productDetails) => {
        try {

            // Create an array of restructured product details
            setSelectedOffer('');
            const reStructuredProductDetails = productDetails.map(product => {
                const name = product.name;
                const _id = product.currentID;
                const ptype = product.ptype;
                const discount = product.discount;
                const selectedVariation = product.variation;
                const price = product.price;
                const barcodeQty = product.qty || 1;
                const oderTax = product.tax;
                const specialDiscount = product.specialDiscount || 0;

                return {
                    name,
                    _id,
                    ptype,
                    discount,
                    specialDiscount,
                    selectedVariation,
                    price,
                    barcodeQty,
                    oderTax,
                };
            });

            // Set selectedProduct to reStructuredProductDetails
            const selectedProduct = reStructuredProductDetails;
            const paymentTypesArray = Object.keys(amounts).reduce((acc, type) => {
                if (Number(amounts[type]) > 0) {
                    acc[type] = amounts[type];
                }
                return acc;
            }, {});

            console.log("Corrected Payment Types Array:", paymentTypesArray);

            handleSave(
                calculateTotalPrice(),
                profit,
                "ordered",
                'paid',
                paymentTypesArray,
                amounts,
                shipping,
                discountType,
                discount,
                tax,
                warehouse ? warehouse : 'Unknown',
                selectedCustomer ? selectedCustomer : 'Unknown',
                selectedProduct,
                date,
                preFix,
                offerPercentage,
                setInvoiceNumber,
                setResponseMessage,
                setError,
                setProgress
            );
            console.log("type of setProgress", setProgress);
            await fetchAllData();
            return;
        } catch (error) {
            console.error('Error updating product quantities:', error);
        }
    };

    const handleSubmitPayment = async () => {
        if (!validatePaymentStatus()) return; // Prevent submission if validation fails

        try {
            const invoiceNumber = await updateProductQuantities(productDetails);
            handlePrintAndClose();
            setSelectedOffer('')
        } catch (error) {
            console.error('Error updating product quantities:', error);
        }
    };


    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/findRegisterData`);
                // Check if response data contains an array and access the first item
                if (Array.isArray(response.data.data) && response.data.data.length > 0) {
                    const name = response.data.data[0].name;
                    setRegisterData(name);
                } else {
                    console.error('Data array is empty or not found.');
                    setRegisterData('');
                }
            } catch (err) {
                console.error('Error fetching report data:', err);
                setError('Failed to fetch report data');
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white w-[1200px] h-[700px] p-6 rounded-md shadow-lg z-50">
                <h2 className="text-xl font-semibold">Make Payment</h2>
                <div className="flex mt-4">
                    <div>
                        <div className='flex'>
                            <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Paying Amount:</label>
                                <input
                                    type="text"
                                    placeholder="Paying Amount"
                                    value={calculateTotalPrice()}
                                    className="block w-[300px] rounded-md border-0 py-2.5 px-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm"
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Payment Status:</label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    className="block w-[300px] ml-10 rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
                                >
                                    <option>Paid</option>
                                    {/* <option>Unpaid</option> */}
                                </select>
                            </div>
                        </div>
                        <div className="w-full text-center mt-8">
                            <label className="text-sm font-medium leading-6 text-gray-900 mb-2 text-left">
                                Payment Type:
                            </label>
                        </div>
                        <div className="w-full">
                            <div className="bg-gray-100 border border-gray-400 shadow-md rounded-lg p-4">
                                <h2 className="text-lg text-gray-800 mb-3">Add Payment Details</h2>
                                <table className="w-full border border-gray-300 rounded-lg bg-white shadow-sm">
                                    <tbody>
                                        {['cash', 'card', 'bank_transfer'].map((type, index) => (
                                            <tr key={index} className="border-t border-gray-300 hover:bg-gray-100">
                                                <td className="px-4 py-4 font-medium text-gray-700 border border-gray-300 bg-gray-200">
                                                    {type === 'cash' ? 'Cash' : type === 'card' ? 'Card' : 'Bank Transfer'}
                                                </td>
                                                <td className="px-4 py-1 border border-gray-300">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={amounts[type]}
                                                            onChange={(e) => handleAmountChange(type, e.target.value)}
                                                            placeholder="Enter amount"
                                                            className="block w-full rounded-md border-0 py-2.5 px-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-xs text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-500 focus:outline-none sm:text-sm"
                                                        />
                                                        <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                                                            {currency}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Balance Field Row */}
                                        <tr className="border-t border-gray-300 hover:bg-gray-100">
                                            <td colSpan="2" className="px-4 py-4 text-right font-semibold text-gray-700 border border-gray-300">
                                                Balance: {currency} {formatWithCustomCommas(calculateBalance())}
                                            </td>
                                        </tr>

                                        {/* Note Field Row */}
                                        <tr className="border-t border-gray-300 hover:bg-gray-100">
                                            <td className="px-4 py-4 font-medium text-gray-700 border border-gray-300 bg-gray-200">
                                                Note
                                            </td>
                                            <td className="px-4 py-1 border border-gray-300">
                                                <textarea
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    placeholder="Enter any additional notes..."
                                                    className="block w-full h-[50px] rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-500 focus:outline-none sm:text-sm"
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>


                        <div className="container mx-auto text-left">
                            <div className='mt-10 flex justify-start'>
                                <button
                                    className="px-4 py-2 mr-2 bg-gray-500 text-white rounded-md"
                                    onClick={handlePopupClose}
                                    type="button"
                                >
                                    Cancel
                                </button>

                                <button
                                    className="px-4 py-2 button-bg-color text-white rounded-md"
                                    onClick={handleSubmitPayment}
                                    type="button"
                                >
                                    Submit Payment
                                </button>

                                <ReactToPrint
                                    trigger={() => (
                                        <button
                                            className="px-4 py-2 ml-2 button-bg-color text-white rounded-md"
                                            type="button"
                                        >
                                            Submit & Print Bill
                                        </button>
                                    )}
                                    content={() => printRef.current}
                                    onBeforeGetContent={async () => {
                                        if (!validatePaymentStatus()) {
                                            return Promise.reject(); // Prevent print if validation fails
                                        }

                                        try {
                                            await updateProductQuantities(productDetails); // Ensure sale is saved
                                            console.log('Sale saved successfully before printing');
                                            return Promise.resolve();
                                        } catch (error) {
                                            console.error('Error saving sale before printing:', error);
                                            alert('Failed to save the sale. Please try again.');
                                            return Promise.reject(); // Prevent printing if saving fails
                                        }
                                    }}
                                    onAfterPrint={() => {
                                        handlePrintAndClose(); // Handle additional logic after printing
                                    }}

                                />
                            </div>
                        </div>

                    </div>

                    <div className='mt-0 ml-10 w-[500px]'>
                        <label className="block text-sm font-medium leading-6 text-gray-900 mb-4">Summary of Sale:</label>
                        <table className="min-w-[450px] border border-gray-300 rounded-lg">
                            <tbody>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Total Products</td>
                                    <td className="px-2 py-2 text-sm text-left text-gray-600 border border-gray-300">{totalItems}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Total Amount</td>
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">{currency}{' '}{formatWithCustomCommas(calculateTotalPrice())}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Order Tax</td>
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">{tax}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Discount</td>
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">{currency}{' '}{discount}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Shipping</td>
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">{currency}{' '}{shipping}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">Grand Total</td>
                                    <td className="px-2 py-2 text-m text-left text-gray-600 border border-gray-300">{currency}{' '}{formatWithCustomCommas(calculateTotalPrice())}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Render PrintInvoice here but hide it */}
                <div style={{ display: 'none' }}>
                    <PrintInvoice
                        ref={printRef}
                        invoiceNumber={invoiceNumber}
                        productDetails={productDetails}
                        total={totalPrice}
                        totalItems={totalItems}
                        totalPcs={totalPcs}
                        receivedAmount={totalReceivedAmount}
                        returnAmount={returnAmount}
                        tax={tax}
                        shipping={shipping}
                        discount={discount}
                        paymentAmounts={amounts} // Add this line
                        paymentStatus={paymentStatus}
                        selectedCustomer={selectedCustomer}
                        registerData={registerData}
                        note={note}
                        offerPercentage={offerPercentage}
                    />
                </div>
                <div>
                    {errors && <p className="text-green-500 mt-5 text-center">{errors}</p>}
                </div>
                <div className="flex relative justify-center mt-2 ml-0 mr-0 text-center">
                    {responseMessage && (
                        <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">
                            {responseMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PayingSection;
