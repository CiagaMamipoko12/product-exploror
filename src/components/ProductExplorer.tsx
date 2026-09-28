"use client";

import { useEffect, useState } from "react";

import {
    defaultQuery,
    fetchProducts,
} from "@/lib/products";

import type {
    Product,
    ProductDraft,
    ProductList,
    SearchQuery,
} from "@/lib/products";

import ProductSearchForm from "./ProductSearchForm";
import ProductForm from "./ProductForm";

type LoadState =
    | "loading"
    | "error"
    | "ready";

export default function ProductExplorer() {
    const [products, setProducts] =
        useState<Product[]>([]);

    const [addedProducts, setAddedProducts] =
        useState<Product[]>([]);

    // สินค้าที่กำลังแก้ไข
    const [editing, setEditing] =
        useState<Product | null>(null);

    const [status, setStatus] =
        useState<LoadState>("loading");

    const [errorMessage, setErrorMessage] =
        useState("");

    // แสดงผลลัพธ์
    function showResult(list: ProductList) {
        setProducts(list.products);
        setStatus("ready");
    }

    // แสดง Error
    function showError(error: unknown) {
        setErrorMessage(
            error instanceof Error
                ? error.message
                : "เรียกข้อมูลไม่สำเร็จ"
        );

        setStatus("error");
    }

    // ค้นหา / โหลดสินค้า
    async function loadProducts(
        query: SearchQuery
    ) {
        setStatus("loading");
        setErrorMessage("");

        try {
            const list =
                await fetchProducts(query);

            // ค้นหาสินค้าที่เพิ่มเอง
            const localProducts =
                addedProducts.filter(
                    (product) =>
                        product.title
                            .toLowerCase()
                            .includes(
                                query.q.toLowerCase()
                            )
                );

            // รวมสินค้าจาก API
            // กับสินค้าที่เพิ่มเอง
            const allProducts = [
                ...localProducts,
                ...list.products,
            ];

            // เรียงข้อมูล
            allProducts.sort((a, b) => {
                if (
                    query.sortBy === "title"
                ) {
                    return a.title.localeCompare(
                        b.title
                    );
                }

                if (
                    query.sortBy === "price"
                ) {
                    return a.price - b.price;
                }

                return a.stock - b.stock;
            });

            // จำกัดจำนวนรายการ
            const result =
                allProducts.slice(
                    0,
                    query.limit
                );

            showResult({
                products: result,
                total: result.length,
                skip: 0,
                limit: query.limit,
            });
        } catch (error) {
            showError(error);
        }
    }

    // โหลดข้อมูลครั้งแรก
    useEffect(() => {
        fetchProducts(defaultQuery)
            .then(showResult)
            .catch(showError);
    }, []);

    // เพิ่ม / แก้ไขสินค้า
    function saveProduct(
        draft: ProductDraft
    ) {
        // =========================
        // กรณีแก้ไขสินค้า
        // =========================
        if (editing) {
            const updatedProduct: Product = {
                ...editing,
                ...draft,
                id: editing.id,
            };

            // อัปเดตสินค้าที่แสดงอยู่
            setProducts((prev) =>
                prev.map((product) =>
                    product.id === editing.id
                        ? updatedProduct
                        : product
                )
            );

            // ถ้าเป็นสินค้าที่เพิ่มเอง
            // ให้อัปเดตใน addedProducts ด้วย
            setAddedProducts((prev) =>
                prev.map((product) =>
                    product.id === editing.id
                        ? updatedProduct
                        : product
                )
            );

            // ออกจากโหมดแก้ไข
            setEditing(null);

            return;
        }

        // =========================
        // กรณีเพิ่มสินค้าใหม่
        // =========================
        const newProduct: Product = {
            ...draft,
            id: Date.now(),
        };

        // เก็บสินค้าที่เพิ่มเอง
        setAddedProducts((prev) => [
            ...prev,
            newProduct,
        ]);

        // แสดงสินค้าใหม่ทันที
        setProducts((prev) => [
            newProduct,
            ...prev,
        ]);
    }

    // ลบสินค้า
    function removeProduct(id: number) {
        // ลบออกจากรายการที่แสดง
        setProducts((prev) =>
            prev.filter(
                (product) =>
                    product.id !== id
            )
        );

        // ลบออกจากสินค้าที่เพิ่มเอง
        setAddedProducts((prev) =>
            prev.filter(
                (product) =>
                    product.id !== id
            )
        );

        // ถ้ากำลังแก้ไขสินค้าที่ถูกลบ
        // ให้กลับไปโหมดเพิ่มสินค้า
        if (editing?.id === id) {
            setEditing(null);
        }
    }

    // ยกเลิกการแก้ไข
    function cancelEdit() {
        setEditing(null);
    }

    return (
        <main>
            <h1>รายการสินค้า</h1>

            {/* ฟอร์มค้นหา */}
            <ProductSearchForm
                onSearch={loadProducts}
            />

            {/* ฟอร์มเพิ่ม / แก้ไข */}
            <ProductForm
                editing={editing}
                onSave={saveProduct}
                onCancel={cancelEdit}
            />

            <section aria-live="polite">
                {/* Loading */}
                {status === "loading" && (
                    <p>
                        กำลังโหลดข้อมูล
                    </p>
                )}

                {/* Error */}
                {status === "error" && (
                    <p role="alert">
                        {errorMessage}
                    </p>
                )}

                {/* Empty State */}
                {status === "ready" &&
                    products.length === 0 && (
                        <p>
                            ไม่พบสินค้าที่ตรงกับเงื่อนไข
                        </p>
                    )}

                {/* ตารางสินค้า */}
                {status === "ready" &&
                    products.length > 0 && (
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        รูปสินค้า
                                    </th>

                                    <th>
                                        ชื่อสินค้า
                                    </th>

                                    <th>
                                        ราคา
                                    </th>

                                    <th>
                                        คงเหลือ
                                    </th>

                                    <th>
                                        หมวดหมู่
                                    </th>

                                    <th>
                                        จัดการ
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {products.map(
                                    (item) => (
                                        <tr
                                            key={
                                                item.id
                                            }
                                        >
                                            {/* รูปสินค้า */}
                                            <td>
                                                {item.thumbnail && (
                                                    <img
                                                        src={
                                                            item.thumbnail
                                                        }
                                                        alt={
                                                            item.title
                                                        }
                                                        width={
                                                            70
                                                        }
                                                        height={
                                                            70
                                                        }
                                                    />
                                                )}
                                            </td>

                                            {/* ชื่อ */}
                                            <td>
                                                {
                                                    item.title
                                                }
                                            </td>

                                            {/* ราคา */}
                                            <td>
                                                {
                                                    item.price
                                                }
                                            </td>

                                            {/* คงเหลือ */}
                                            <td>
                                                {
                                                    item.stock
                                                }
                                            </td>

                                            {/* หมวดหมู่ */}
                                            <td>
                                                {
                                                    item.category
                                                }
                                            </td>

                                            {/* ปุ่มจัดการ */}
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditing(
                                                            item
                                                        )
                                                    }
                                                >
                                                    แก้ไข
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeProduct(
                                                            item.id
                                                        )
                                                    }
                                                >
                                                    ลบ
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    )}
            </section>
        </main>
    );
}