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

// Helper function to validate the mobile number input
export const isValidMobileInput = (value) => /^[+\d]*$/.test(value);

// Helper function to determine if a key is allowed
export const isAllowedKey = (key) => {
    const allowedKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "ArrowLeft",
        "ArrowRight",
        "Enter",
        "Escape"
    ];
    return allowedKeys.includes(key) || /[\d+]/.test(key);
};