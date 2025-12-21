import React, { useState, useEffect, useRef } from 'react';
import { Input, AutoComplete } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

/**
 * Componente para búsqueda de productos
 * Soporta:
 * - Búsqueda manual con autocompletado
 * - Scanner USB (detecta Enter automático)
 */
const BarcodeScanner = ({
    onScan,
    onSearch,
    placeholder = 'Buscar producto...',
    suggestions = [],
    autoFocus = true,
    size = 'large',
}) => {
    const [value, setValue] = useState('');
    const [options, setOptions] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    useEffect(() => {
        if (suggestions && suggestions.length > 0) {
            const formattedOptions = suggestions.map((item) => ({
                value: item.nombre,
                label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.nombre}</span>
                        <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                            Stock: {item.total_disponible || 0}
                        </span>
                    </div>
                ),
                item: item,
            }));
            setOptions(formattedOptions);
        } else {
            setOptions([]);
        }
    }, [suggestions]);

    const handleChange = (newValue) => {
        setValue(newValue);

        // Llamar a onSearch si existe
        if (onSearch && newValue.length >= 2) {
            onSearch(newValue);
        }
    };

    const handleSelect = (selectedValue, option) => {
        if (option && option.item) {
            onScan({ item: option.item });
            setValue('');
        }
    };

    const handlePressEnter = (e) => {
        if (value.trim()) {
            // Si hay opciones, seleccionar la primera
            if (options.length > 0 && options[0].item) {
                onScan({ item: options[0].item });
                setValue('');
            } else {
                // Intentar buscar por código de barras
                onScan({ codigo_barras: value.trim() });
                setValue('');
            }
        }
    };

    return (
        <AutoComplete
            ref={inputRef}
            value={value}
            options={options}
            onChange={handleChange}
            onSelect={handleSelect}
            style={{ width: '100%' }}
            notFoundContent={value.length >= 2 ? 'No se encontraron productos' : null}
        >
            <Input
                size={size}
                placeholder={placeholder}
                prefix={<SearchOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
                onPressEnter={handlePressEnter}
                autoFocus={autoFocus}
                allowClear
            />
        </AutoComplete>
    );
};

export default BarcodeScanner;
