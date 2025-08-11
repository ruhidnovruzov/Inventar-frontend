import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    PlusCircle, Edit, Trash2, X, AlertCircle, RefreshCw, Save,
    Laptop, Printer, Monitor, Projector, Cpu, HardDrive, Phone,
    LogOut
} from 'lucide-react';

// Sabitlər
const API_BASE_URL = 'https://inventar-backend.onrender.com/api';

const ENTITY_TYPES = {
    KOMPUTERLER: 'komputerler',
    PRINTERLER: 'printerler',
    MONITORLAR: 'monitorlar',
    PROYEKTORLAR: 'proyektorlar',
    MONOBLOKLAR: 'monobloklar',
    TEXNIKI_GOSTERICILER: 'texniki-gostericiler',
    IP_TELEFONLAR: 'ip-telefonlar'
};

const TAB_CONFIG = [
    {
        key: ENTITY_TYPES.KOMPUTERLER,
        label: 'Kompüterlər',
        icon: Laptop
    },
    {
        key: ENTITY_TYPES.PRINTERLER,
        label: 'Printerlər',
        icon: Printer
    },
    {
        key: ENTITY_TYPES.MONITORLAR,
        label: 'Monitorlar',
        icon: Monitor
    },
    {
        key: ENTITY_TYPES.PROYEKTORLAR,
        label: 'Proyektorlar',
        icon: Projector
    },
    {
        key: ENTITY_TYPES.MONOBLOKLAR,
        label: 'Monobloklar',
        icon: HardDrive
    },
    {
        key: ENTITY_TYPES.TEXNIKI_GOSTERICILER,
        label: 'Texniki Göstəricilər',
        icon: Cpu
    },
    {
        key: ENTITY_TYPES.IP_TELEFONLAR,
        label: 'IP Telefonlar',
        icon: Phone
    }
];

// Kompüter və Monoblok kateqoriyaları üçün sabit
const KOMPUTER_KATEGORIYALARI = ['Auditoriya', 'İnzibati', 'Akademik', 'Laboratoriya', 'Digər'];

// Korpuslar üçün nümunə sabit
const KORPUSLAR = [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII'
];


// Yardımçı funksiyalar
const getEntityDisplayName = (entityType) => {
    const config = TAB_CONFIG.find(tab => tab.key === entityType);
    return config ? config.label.replace(/lər|lar/g, '') : entityType;
};

// Ana komponent
function AdminPanel() {
    // State-lər
    const [data, setData] = useState({
        [ENTITY_TYPES.KOMPUTERLER]: [],
        [ENTITY_TYPES.PRINTERLER]: [],
        [ENTITY_TYPES.MONITORLAR]: [],
        [ENTITY_TYPES.PROYEKTORLAR]: [],
        [ENTITY_TYPES.MONOBLOKLAR]: [],
        [ENTITY_TYPES.TEXNIKI_GOSTERICILER]: [],
        [ENTITY_TYPES.IP_TELEFONLAR]: []
    });

    const [ui, setUi] = useState({
        isLoading: true,
        error: null,
        activeTab: ENTITY_TYPES.KOMPUTERLER,
        isModalOpen: false,
        modalType: 'add',
        currentEntity: '',
        editingId: null
    });

    const [formData, setFormData] = useState({});

    const logout = () => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
    }

    // API çağrıları
    const fetchData = useCallback(async (entityType) => {
        setUi(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const response = await axios.get(`${API_BASE_URL}/${entityType}`);
            setData(prev => ({
                ...prev,
                [entityType]: response.data
            }));
        } catch (err) {
            console.error(`Error fetching ${entityType}:`, err);
            setUi(prev => ({
                ...prev,
                error: `Məlumatları yükləmək mümkün olmadı: ${entityType}`
            }));
        } finally {
            setUi(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    // İlkin yükləmə və tab dəyişdikdə məlumatları çəkmə
    useEffect(() => {
        fetchData(ui.activeTab);
    }, [ui.activeTab, fetchData]);

    // Form idarəetməsi
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('parametrinDeyerleri.')) {
            const [, index, field] = name.split('.');
            const newDeyerler = [...(formData.parametrinDeyerleri || [])];

            if (!newDeyerler[index]) {
                newDeyerler[index] = {};
            }

            newDeyerler[index][field] = field === 'say' ? parseInt(value) || 0 : value;

            setFormData(prev => ({
                ...prev,
                parametrinDeyerleri: newDeyerler
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'say' ? parseInt(value) || 0 : value
            }));
        }
    };

    const addTexnikiGostericiDeyer = () => {
        setFormData(prev => ({
            ...prev,
            parametrinDeyerleri: [...(prev.parametrinDeyerleri || []), { deyer: '', say: 0 }]
        }));
    };

    const removeTexnikiGostericiDeyer = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            parametrinDeyerleri: prev.parametrinDeyerleri.filter((_, index) => index !== indexToRemove)
        }));
    };

    // Modal idarəetməsi
    const openModal = (type, entityType, item = null) => {
        setUi(prev => ({
            ...prev,
            modalType: type,
            currentEntity: entityType,
            isModalOpen: true,
            editingId: item?._id || null
        }));
        setFormData(item ? { ...item } : (entityType === ENTITY_TYPES.KOMPUTERLER || entityType === ENTITY_TYPES.MONOBLOKLAR ? { kategoriya: KOMPUTER_KATEGORIYALARI[0] } : {}));
    };

    const closeModal = () => {
        setUi(prev => ({
            ...prev,
            isModalOpen: false,
            error: null
        }));
        setFormData({});
    };

    // CRUD əməliyyatları
    const handleSubmit = async (e) => {
        e.preventDefault();
        setUi(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const { modalType, currentEntity, editingId } = ui;

            if (modalType === 'add') {
                await axios.post(`${API_BASE_URL}/${currentEntity}`, formData);
            } else {
                await axios.put(`${API_BASE_URL}/${currentEntity}/${editingId}`, formData);
            }

            await fetchData(currentEntity);
            closeModal();
        } catch (err) {
            console.error(`Error submitting ${ui.currentEntity}:`, err);
            const errorMessage = err.response?.data?.message || err.message;
            setUi(prev => ({
                ...prev,
                error: `Məlumatı saxlamaq mümkün olmadı: ${errorMessage}`
            }));
        } finally {
            setUi(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleDelete = async (entityType, id) => {
        if (!window.confirm('Bu elementi silmək istədiyinizə əminsiniz?')) {
            return;
        }

        try {
            setUi(prev => ({ ...prev, isLoading: true }));
            await axios.delete(`${API_BASE_URL}/${entityType}/${id}`);
            await fetchData(entityType);
        } catch (err) {
            console.error(`Error deleting ${entityType}:`, err);
            const errorMessage = err.response?.data?.message || err.message;
            setUi(prev => ({
                ...prev,
                error: `Elementi silmək mümkün olmadı: ${errorMessage}`
            }));
        } finally {
            setUi(prev => ({ ...prev, isLoading: false }));
        }
    };

    // Render funksiyaları
    const renderFormFields = () => {
        const { currentEntity } = ui;

        const commonFields = (
            <>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Korpus
                    </label>
                    <select
                        name="korpus"
                        value={formData.korpus || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    >
                        <option value="" disabled>Korpusu seçin</option>
                        {KORPUSLAR.map((korpusOption) => (
                            <option key={korpusOption} value={korpusOption}>
                                {korpusOption}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Say
                    </label>
                    <input
                        type="number"
                        name="say"
                        value={formData.say || 0}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        min="0"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Qeydlər
                    </label>
                    <textarea
                        name="qeydler"
                        value={formData.qeydler || ''}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </>
        );

        if (currentEntity === ENTITY_TYPES.KOMPUTERLER || currentEntity === ENTITY_TYPES.MONOBLOKLAR) {
            return (
                <>
                    {commonFields}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kateqoriya
                        </label>
                        <div className="mt-2 space-y-2">
                            {KOMPUTER_KATEGORIYALARI.map((kategoriya) => (
                                <div key={kategoriya} className="flex items-center">
                                    <input
                                        id={`kategoriya-${kategoriya}`}
                                        name="kategoriya"
                                        type="radio"
                                        value={kategoriya}
                                        checked={formData.kategoriya === kategoriya}
                                        onChange={handleInputChange}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                        required
                                    />
                                    <label htmlFor={`kategoriya-${kategoriya}`} className="ml-2 block text-sm text-gray-900">
                                        {kategoriya}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            );
        }

        if (currentEntity === ENTITY_TYPES.TEXNIKI_GOSTERICILER) {
            return (
                <>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Parametr Adı
                        </label>
                        <input
                            type="text"
                            name="parametrAd"
                            value={formData.parametrAd || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <h4 className="text-lg font-medium text-gray-700 mb-3">
                            Parametrin Dəyərləri
                        </h4>
                        {(formData.parametrinDeyerleri || []).map((deyer, index) => (
                            <div key={index} className="flex items-center space-x-2 mb-2">
                                <input
                                    type="text"
                                    name={`parametrinDeyerleri.${index}.deyer`}
                                    value={deyer.deyer || ''}
                                    onChange={handleInputChange}
                                    placeholder="Dəyər"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="number"
                                    name={`parametrinDeyerleri.${index}.say`}
                                    value={deyer.say || 0}
                                    onChange={handleInputChange}
                                    placeholder="Say"
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    min="0"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeTexnikiGostericiDeyer(index)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addTexnikiGostericiDeyer}
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                        >
                            Dəyər Əlavə Et
                        </button>
                    </div>
                </>
            );
        }

        if (currentEntity === ENTITY_TYPES.IP_TELEFONLAR) {
            return (
                <>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ad (Opsional)
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vəzifə
                        </label>
                        <input
                            type="text"
                            name="position"
                            value={formData.position || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Telefon Nömrəsi
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                </>
            );
        }

        return commonFields;
    };

    const renderTableHeader = (entityType) => {
        const headers = {
            [ENTITY_TYPES.KOMPUTERLER]: ['Korpus', 'Say', 'Kateqoriya', 'Qeydlər', 'Əməliyyatlar'],
            [ENTITY_TYPES.PRINTERLER]: ['Korpus', 'Say', 'Qeydlər', 'Əməliyyatlar'],
            [ENTITY_TYPES.MONITORLAR]: ['Korpus', 'Say', 'Qeydlər', 'Əməliyyatlar'],
            [ENTITY_TYPES.PROYEKTORLAR]: ['Korpus', 'Say', 'Qeydlər', 'Əməliyyatlar'],
            [ENTITY_TYPES.MONOBLOKLAR]: ['Korpus', 'Say', 'Kateqoriya', 'Qeydlər', 'Əməliyyatlar'],
            [ENTITY_TYPES.TEXNIKI_GOSTERICILER]: ['Parametr Adı', 'Dəyərlər (Say)', 'Əməliyyatlar'],
            [ENTITY_TYPES.IP_TELEFONLAR]: ['Ad', 'Vəzifə', 'Telefon', 'Əməliyyatlar']
        };

        return (
            <thead className="bg-gray-50">
                <tr>
                    {headers[entityType].map((header, index) => (
                        <th
                            key={index}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
        );
    };

    const renderTableRow = (item, entityType) => {
        const actionButtons = (
            <div className="flex space-x-2">
                <button
                    onClick={() => openModal('edit', entityType, item)}
                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                >
                    <Edit size={18} />
                </button>
                <button
                    onClick={() => handleDelete(entityType, item._id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        );

        if (entityType === ENTITY_TYPES.TEXNIKI_GOSTERICILER) {
            return (
                <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.parametrAd}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                            {(item.parametrinDeyerleri || []).map((deyer, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span>{deyer.deyer}:</span>
                                    <span className="font-medium">{deyer.say}</span>
                                </div>
                            ))}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{actionButtons}</td>
                </tr>
            );
        }

        if (entityType === ENTITY_TYPES.IP_TELEFONLAR) {
            return (
                <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{actionButtons}</td>
                </tr>
            );
        }

        return (
            <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.korpus}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.say}
                </td>
                {(entityType === ENTITY_TYPES.KOMPUTERLER || entityType === ENTITY_TYPES.MONOBLOKLAR) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.kategoriya || '-'}
                    </td>
                )}
                <td className="px-6 py-4 text-sm text-gray-900">
                    {item.qeydler || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{actionButtons}</td>
            </tr>
        );
    };

    const renderTable = () => {
        if (ui.isLoading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin mr-2" size={20} />
                    <span className="text-gray-600">Məlumatlar yüklənir...</span>
                </div>
            );
        }

        if (ui.error) {
            return (
                <div className="flex items-center justify-center py-12 text-red-500">
                    <AlertCircle className="mr-2" size={20} />
                    <span>{ui.error}</span>
                </div>
            );
        }

        const currentData = data[ui.activeTab] || [];

        if (currentData.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500">
                    Hələ heç bir məlumat yoxdur
                </div>
            );
        }

        return (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    {renderTableHeader(ui.activeTab)}
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentData.map(item => renderTableRow(item, ui.activeTab))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-3">
            <button onClick={() => logout()} className='flex gap-1 absolute right-3'><LogOut /> Çıx</button>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Başlıq */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                    <p className="mt-2 text-gray-600">Avadanlıqların idarə edilməsi sistemi</p>
                </div>

                {/* Tab Navigasiyası */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setUi(prev => ({ ...prev, activeTab: key }))}
                            className={`
                                inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200
                                ${ui.activeTab === key
                                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm hover:shadow-md'
                                }
                            `}
                        >
                            <Icon className="mr-2" size={18} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Əlavə et düyməsi */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => openModal('add', ui.activeTab)}
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                        <PlusCircle className="mr-2" size={20} />
                        Yeni {getEntityDisplayName(ui.activeTab)} Əlavə Et
                    </button>
                </div>

                {/* Cədvəl */}
                <div className="bg-white rounded-lg shadow-md">
                    {renderTable()}
                </div>

                {/* Modal */}
                {ui.isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-6 pt-6 pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {ui.modalType === 'add' ? 'Yeni' : 'Redaktə Et'} {getEntityDisplayName(ui.currentEntity)}
                                        </h3>
                                        <button
                                            onClick={closeModal}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit}>
                                        {renderFormFields()}

                                        {ui.error && (
                                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                                <div className="flex items-center">
                                                    <AlertCircle className="mr-2 text-red-500" size={16} />
                                                    <p className="text-sm text-red-700">{ui.error}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end space-x-3 pt-4 border-t">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                            >
                                                Ləğv Et
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={ui.isLoading}
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {ui.isLoading && <RefreshCw className="animate-spin mr-2" size={16} />}
                                                <Save className="mr-2" size={16} />
                                                Yadda Saxla
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminPanel;