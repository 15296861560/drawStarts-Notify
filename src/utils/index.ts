/*
 * @Description: 
 * @Version: 2.0
 * @Autor: lgy
 * @Date: 2023-02-26 13:13:39
 * @LastEditors: lgy
 * @LastEditTime: 2023-02-26 13:14:42
 */
export function generateId(len: number = 10) {
    const typeArray = new Uint8Array(len / 2)
    window.crypto.getRandomValues(typeArray)
    return Array.from(typeArray, dec => dec.toString(16).padStart(2, "0")).join('')
} 