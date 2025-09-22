import { useEffect } from "react";

function ProductFilters({ setFilters, setLoading }) {
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [brandResponse, warehouseResponse, categoryResponse] = await Promise.all([
                    // Use ONLY the non-paginated endpoint for brands
                    fetch(`${process.env.REACT_APP_BASE_URL}/api/fetchAllBrandsNoPagination`),
                    fetch(`${process.env.REACT_APP_BASE_URL}/api/fetchWarehouses`),
                    fetch(`${process.env.REACT_APP_BASE_URL}/api/fetchAllCategoriesNoPagination`),
                ]);

                const brands = await brandResponse.json();
                const warehouses = await warehouseResponse.json();
                const categories = await categoryResponse.json();

                console.log('Brands fetched:', brands.data?.length); // Debug log

                setFilters({
                    brands: Array.isArray(brands.data) ? brands.data : [],
                    warehouses: Array.isArray(warehouses?.warehouses) ? warehouses.warehouses : [],
                    categories: Array.isArray(categories?.data) ? categories.data : [],
                });
            } catch (error) {
                console.error("Error fetching data:", error);
                setFilters({
                    brands: [],
                    warehouses: [],
                    categories: [],
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return null;
}

export default ProductFilters;