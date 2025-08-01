import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Building2, GraduationCap, Users, DoorOpen, BookOpen, Laptop, RefreshCw,
    AlertCircle, Monitor, Printer, Projector, Cpu, Cable, X, Phone,
    HardDrive // Monobloklar üçün yeni icon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import PhoneTable from '../PhoneTable';

// AnimatedCounter komponenti: Rəqəmlərin animasiyalı şəkildə artmasını təmin edir.
function AnimatedCounter({ end, duration = 500 }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setCount(end);
            }
        };

        window.requestAnimationFrame(step);
    }, [end, duration]);

    return <>{count.toLocaleString()}</>;
}

// LoadingCard komponenti: Məlumatlar yüklənərkən göstərilən animasiyalı kart.
function LoadingCard() {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="bg-gray-200 h-12 w-12 rounded-lg"></div>
                        <div className="mt-4 h-6 bg-gray-200 rounded w-24"></div>
                        <div className="mt-1 h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-12 w-1 bg-gray-200 rounded-full"></div>
                </div>
                <div className="mt-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
            </div>
        </div>
    );
}

// ErrorState komponenti: Məlumat yüklənməsində xəta baş verdikdə göstərilən və yenidən cəhd düyməsi olan hissə.
function ErrorState({ onRetry }) {
    return (
        <div className="min-h-[300px] flex items-center justify-center">
            <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Məlumatları yükləmək mümkün olmadı</h3>
                <p className="text-gray-500 mb-4">Zəhmət olmasa bir az sonra yenidən cəhd edin</p>
                <button
                    onClick={onRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Yenidən cəhd et
                </button>
            </div>
        </div>
    );
}

// Modal komponenti: Kartlara kliklənərkən açılan detallı məlumat pəncərəsi.
// Modal komponenti: Kartlara kliklənərkən açılan detallı məlumat pəncərəsi.
// Modal komponenti: Kartlara kliklənərkən açılan detallı məlumat pəncərəsi.
function Modal({ isOpen, onClose, data, loadingModalData }) {
    if (!isOpen) return null;

    let modalContent;

    if (loadingModalData) {
        modalContent = (
            <div className="flex justify-center items-center h-48">
                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                <span className="ml-2 text-lg text-gray-700">Məlumatlar yüklənir...</span>
            </div>
        );
    } else if (!data.details || data.details.length === 0) {
        modalContent = <p className="text-gray-600">Detallı məlumat yoxdur.</p>;
    } else if (data.name.includes('Ümumi Kompüter Sayı')) {
        // Ümumi kompüter sayı üçün qruplaşdırma məntiqi
        const groupedData = data.details.reduce((acc, item) => {
            const korpus = item.korpus || 'Korpus Təyin Olunmayıb';
            const kategoriya = item.kategoriya || 'Kateqoriya Təyin Olunmayıb';
            const itemSay = item.say || 1;

            if (!acc[korpus]) {
                acc[korpus] = {
                    totalSay: 0,
                    categories: {},
                };
            }
            
            acc[korpus].totalSay += itemSay;
            
            if (!acc[korpus].categories[kategoriya]) {
                acc[korpus].categories[kategoriya] = 0;
            }
            acc[korpus].categories[kategoriya] += itemSay;
            return acc;
        }, {});

        modalContent = (
            <div className="space-y-4">
                {Object.keys(groupedData).map((korpus, index) => {
                    const korpusDetails = groupedData[korpus];
                    const categoryDetails = Object.keys(korpusDetails.categories)
                        .map(k => `${k}: ${korpusDetails.categories[k]} ədəd`)
                        .join(' • ');

                    return (
                        <div key={index} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors space-y-1">
                            <p className="text-xl font-semibold text-gray-800">{korpus}</p>
                            <p className="text-sm text-gray-900">
                                Ümumi Say: {korpusDetails.totalSay}
                            </p>
                            {categoryDetails && (
                                <p className="text-sm text-gray-800">
                                    {categoryDetails}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    } else if (data.name.includes('kompüter sayı') || data.name.includes('Monoblok Sayı') || data.name.includes('Monitor Sayı') || data.name.includes('Printer Sayı') || data.name.includes('Proyektor Sayı')) {
        // Kateqoriya kompüterləri və digər avadanlıqlar üçün sadə render
        modalContent = (
            <div className="space-y-4">
                {data.details.map((item, index) => (
                    <div key={item._id || index} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors space-y-1">
                        <p className="text-xl font-semibold text-gray-800">Korpus: {item.korpus}</p>
                        <p className="text-sm text-gray-900">
                            Say: {item.say}
                        </p>
                        {/* {item.kategoriya && (
                            <p className="text-sm text-gray-800">
                                Kateqoriya: {item.kategoriya}
                            </p>
                        )} */}
                        {item.qeydler && (
                            <p className="text-sm text-gray-800">
                                Qeydlər: {item.qeydler}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        );
    } else if (data.name === 'Texniki göstəricilər' && data.details && data.details.length > 0) {
        modalContent = (
            <div className="space-y-4">
                {data.details.map((param, index) => (
                    <div key={index} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <h4 className="font-semibold text-lg mb-2">{param.parametrAd}</h4>
                        {param.deyerler && param.deyerler.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                                {param.deyerler.map((deyer, idx) => (
                                    <li key={idx}>{deyer.deyer}: {deyer.say} ədəd</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">Bu parametr üçün dəyərlər tapılmadı.</p>
                        )}
                    </div>
                ))}
            </div>
        );
    } else if (data.name === 'IP telefon Sayı' && data.details) {
        modalContent = <PhoneTable data={data.details} />;
    } else if (data.details && data.details.length > 0) {
        // Digər kartlar üçün mövcud məntiq
        modalContent = (
            <div className="space-y-4">
                {data.details.map((item, index) => (
                    <div key={item._id || index} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        {data.name === 'Avadanlıqlar' && typeof item === 'string' && (
                            <p>{item}</p>
                        )}
                        {(data.name === 'Fakültə' || data.name === 'Kafedra' || data.name === 'Korpuslar' || data.name === 'Otaqlar' || data.name === 'İstifadəçilər') && (
                            typeof item === 'string' ? <p>{item}</p> : (item.name ? <p>{item.name}: {item.value}</p> : null)
                        )}
                    </div>
                ))}
            </div>
        );
    } else {
        modalContent = <p className="text-gray-600">Detallı məlumat yoxdur.</p>;
    }


    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-2xl font-bold text-gray-900">{data.name} Detalları</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {modalContent}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-950 transform transition-all duration-200 hover:scale-105"
                        >
                            Bağla
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}



function Dashboard() {
    const [stats, setStats] = useState({
        common_computer_count: 0,
        auditoriya_computer_count: 0,
        inzibati_computer_count: 0,
        akademik_computer_count: 0,
        diger_computer_count: 0,
        monitor_count: 0,
        printer_count: 0,
        projector_count: 0,
        monoblok_count: 0,
        cpu_count: 0,
        equipment_count: 0,
        // Toxunulmayacaq statik məlumatlar
        faculty_count: 8,
        department_count: 20,
        room_count: 30,
        corps_count: 7,
        user_count: 3,
        tel_count: 0, // Tel count artıq dinamik olacaq
        // Bu iki dəyişən artıq dinamik olacaq, lakin ilkin dəyərlərini saxlayırıq
        audotory_count_computers: 0,
        department_computer_count: 0,
    });

    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ name: '', details: [] });
    const [loadingModalData, setLoadingModalData] = useState(false); // Modal üçün yüklənmə statusu

    const [computerChartData, setComputerChartData] = useState([]);
    const [monitorChartData, setMonitorChartData] = useState([]);
    const [monoblokChartData, setMonoblokChartData] = useState([]);
    const [cpuChartData, setCpuChartData] = useState([]);

    const API_BASE_URL = 'https://inventar-backend.onrender.com/api';

    // Auditoriya və Şöbələr arası kompüterlərin faiz fərqi üçün statik məlumat (toxunulmur)
    const auditoryDeptPieData = [
        { name: 'Auditoriya', value: stats.auditoriya_computer_count },
        { name: 'İnzibati', value: stats.inzibati_computer_count },
        { name: 'Akademik', value: stats.akademik_computer_count },
        { name: 'Digər', value: stats.diger_computer_count }
    ];

    const COLORS = ['#4CAF50', '#FFC107', '#00BCD4', '#E91E63']; // Pie chart üçün rənglər (daha çox kateqoriya üçün)

    // Məlumatları API-dən çəkən funksiya
    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const umumiSaylarRes = await axios.get(`${API_BASE_URL}/statistika/umumi-saylar`);
            const umumiSaylarData = umumiSaylarRes.data;

            const texnikiGostericilerRes = await axios.get(`${API_BASE_URL}/statistika/texniki-gostericiler`);
            const texnikiGostericilerData = texnikiGostericilerRes.data;

            const korpusIcmalRes = await axios.get(`${API_BASE_URL}/statistika/korpus-icmali`);
            const korpusIcmal = korpusIcmalRes.data;

            // IP Telefon sayını əlavə edin
            const ipTelefonSayiRes = await axios.get(`${API_BASE_URL}/ip-telefonlar/count/total`);
            const ipTelefonSayi = ipTelefonSayiRes.data.count;

            let totalTexnikiGostericiCount = 0;
            const cpuChartDetails = [];

            texnikiGostericilerData.forEach(param => {
                param.deyerler.forEach(deyer => {
                    totalTexnikiGostericiCount += deyer.say;
                    if (param.parametrAd === 'CPU' || param.parametrAd === 'Digərləri') {
                        cpuChartDetails.push({ name: deyer.deyer, value: deyer.say });
                    }
                });
            });
            setCpuChartData(cpuChartDetails);

            // Məlumatları state-ə yükləyirik
            setStats(prevStats => ({
                ...prevStats,
                common_computer_count: umumiSaylarData.komputerler.umumiSay,
                auditoriya_computer_count: umumiSaylarData.komputerler.auditoriyaSay,
                inzibati_computer_count: umumiSaylarData.komputerler.inzibatiSay,
                akademik_computer_count: umumiSaylarData.komputerler.akademikSay,
                diger_computer_count: umumiSaylarData.komputerler.digerSay,
                monitor_count: umumiSaylarData.monitorlar.umumiSay,
                printer_count: umumiSaylarData.printerler.umumiSay,
                projector_count: umumiSaylarData.proyektorlar.umumiSay,
                monoblok_count: umumiSaylarData.monobloklar.umumiSay,
                cpu_count: totalTexnikiGostericiCount,
                tel_count: ipTelefonSayi, // Dinamik IP telefon sayı
                equipment_count: umumiSaylarData.komputerler.umumiSay + umumiSaylarData.monitorlar.umumiSay + umumiSaylarData.printerler.umumiSay + umumiSaylarData.proyektorlar.umumiSay + umumiSaylarData.monobloklar.umumiSay + ipTelefonSayi, // Ümumi avadanlıq sayına IP telefonu əlavə edin
                audotory_count_computers: umumiSaylarData.komputerler.auditoriyaSay,
                department_computer_count: umumiSaylarData.komputerler.inzibatiSay + umumiSaylarData.komputerler.akademikSay + umumiSaylarData.komputerler.digerSay,
            }));

            const computerGraphData = korpusIcmal.map(item => ({
                name: item.korpus,
                value: item.komputerSayi
            }));
            setComputerChartData(computerGraphData);

            const monitorGraphData = korpusIcmal.map(item => ({
                name: item.korpus,
                value: item.monitorSayi
            }));
            setMonitorChartData(monitorGraphData);

            const monoblokGraphData = korpusIcmal.map(item => ({
                name: item.korpus,
                value: item.monoblokSayi
            }));
            setMonoblokChartData(monoblokGraphData);

            setLastUpdated(new Date());
            setShouldAnimate(false);
            setTimeout(() => setShouldAnimate(true), 100);
            setIsLoading(false);

        } catch (err) {
            setError(err);
            console.error('Error fetching statistics:', err);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Kartlara kliklənərkən modal məlumatlarını hazırlayan funksiya
    const handleCardClick = async (name, apiPath = null, staticDetails = []) => {
        setIsModalOpen(true);
        setLoadingModalData(true);
        setModalData({ name: name, details: [] });

        let details = [];

        try {
            if (apiPath) {
                const response = await axios.get(`${API_BASE_URL}${apiPath}`);
                details = response.data;
            } else if (name === 'Avadanlıqlar') {
                details = [
                    `Kompüterlər: ${stats.common_computer_count}`,
                    `Monitorlar: ${stats.monitor_count}`,
                    `Printerlər: ${stats.printer_count}`,
                    `Proyektorlar: ${stats.projector_count}`,
                    `Monobloklar: ${stats.monoblok_count}`,
                    `Anbarda olan kompüter: 0`,
                    `Ümumi IP telefon: ${stats.tel_count}` // Dinamik IP telefon sayını göstər
                ];
            } else if (name === 'IP telefon Sayı') {
                const response = await axios.get(`${API_BASE_URL}/ip-telefonlar`); // IP telefon məlumatlarını çək
                details = response.data;
            }
            // Bu hissəni düzəldirik. Artıq `kategoriya` parametrinə görə sorğu göndəririk.
            else if (name.includes('kompüter sayı')) {
                const kategoriya = name.split(' ')[0].replace('Auditoriyalar', 'Auditoriya').replace('İnzibati', 'İnzibati').replace('Akademik', 'Akademik').replace('Ümumi', '');
                const kategoriyaParam = kategoriya.trim() === '' ? '' : `?kategoriya=${kategoriya.trim()}`;
                const response = await axios.get(`${API_BASE_URL}/komputerler${kategoriyaParam}`);
                details = response.data;
            }
            else {
                details = staticDetails;
            }
            setModalData({ name: name, details: details });
        } catch (err) {
            console.error(`Error fetching details for ${name}:`, err);
            setModalData({ name: name, details: [`Məlumatlar yüklənərkən xəta baş verdi: ${err.message}`] });
        } finally {
            setLoadingModalData(false);
        }
    };


    // Kart məlumatları
    const statsData = [
        { name: 'Avadanlıqlar', count: stats.equipment_count, icon: Cable, color: 'bg-red-500', apiPath: null },
        { name: 'Ümumi Kompüter Sayı', count: stats.common_computer_count, icon: Laptop, color: 'bg-blue-500', apiPath: '/komputerler' },
        { name: 'Ümumi Monoblok Sayı', count: stats.monoblok_count, icon: HardDrive, color: 'bg-orange-500', apiPath: '/monobloklar' },
        { name: 'Texniki göstəricilər', count: stats.cpu_count, icon: Cpu, color: 'bg-[#FF6600]', apiPath: '/statistika/texniki-gostericiler' },
        { name: 'Ümumi Monitor Sayı', count: stats.monitor_count, icon: Monitor, color: 'bg-green-500', apiPath: '/monitorlar' },
        { name: 'Ümumi Printer Sayı', count: stats.printer_count, icon: Printer, color: 'bg-purple-500', apiPath: '/printerler' },
        { name: 'Ümumi Proyektor Sayı', count: stats.projector_count, icon: Projector, color: 'bg-yellow-500', apiPath: '/proyektorlar' },
        { name: 'IP telefon Sayı', count: stats.tel_count, icon: Phone, color: 'bg-[#8FD14F]', apiPath: null },

        // Yeni: Kompüter kateqoriyaları üzrə dinamik kartlar
        { name: 'Auditoriyalar üzrə kompüter sayı', count: stats.auditoriya_computer_count, icon: Laptop, color: 'bg-teal-500', apiPath: null, details: [] },
        { name: 'İnzibati heyət üzrə kompüter sayı', count: stats.inzibati_computer_count, icon: Laptop, color: 'bg-cyan-500', apiPath: null, details: [] },
        { name: 'Akademik heyət üzrə kompüter sayı', count: stats.akademik_computer_count, icon: Laptop, color: 'bg-lime-500', apiPath: null, details: [] },
    ];


    return (
        <div className="min-h-screen">
            {/* Header */}
            <header>
                <nav className="bg-gray-800 text-center text-white py-2 font-semibold">
                    <h1 className='text-xl'>Work-in-Progress</h1>
                </nav>
            </header>
            <div className=" ">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex justify-between items-center gap-5">
                        <h1 className="md:text-3xl text-2xl font-semibold text-gray-900">Dashboard</h1>
                        <div className="flex items-center space-x-2 md:space-x-4">
                            {lastUpdated && (
                                <span className="text-sm text-gray-500">
                                    Son yeniləmə: <br /> {lastUpdated.toLocaleTimeString()}
                                </span>
                            )}
                            <button
                                onClick={fetchStats}
                                disabled={isLoading}
                                className={`inline-flex items-center px-2 py-1 md:px-4 md:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${isLoading ? 'animate-pulse' : ''}`}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Yenilə
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {error ? (
                    <ErrorState onRetry={fetchStats} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading
                            ? Array(6).fill(null).map((_, index) => <LoadingCard key={index} />)
                            : statsData.map((item) => (
                                <div
                                    key={item.name}
                                    className="bg-white rounded-lg cursor-pointer shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                    onClick={() => handleCardClick(item.name, item.apiPath, item.details)}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className={`inline-flex p-3 rounded-lg ${item.color} transform transition-transform duration-300 hover:rotate-12`}>
                                                    <item.icon className="h-6 w-6 text-white" />
                                                </div>
                                                <h3 className="mt-4 text-xl font-medium text-gray-900">{item.name}</h3>
                                                <p className="mt-1 text-3xl font-semibold text-gray-900">
                                                    {shouldAnimate ? <AnimatedCounter end={item.count} duration={500} /> : 0}
                                                </p>
                                            </div>
                                            <div className={`h-12 w-1 ${item.color} rounded-full`}></div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    Ümumi say
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                    </div>
                )}
                <div className="w-full h-96 mt-10">
                    <h2 className="text-2xl font-bold text-center mb-4">Kompüterlər</h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={computerChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 'auto']} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#4285F4" barSize={50} label={{ position: 'top', fill: 'black' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-full h-96 mt-20">
                    <h2 className="text-2xl font-bold text-center mb-4">Monobloklar</h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monoblokChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 'auto']} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#FF8C00" barSize={50} label={{ position: 'top', fill: 'black' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>


                <div className="w-full h-96 mt-20">
                    <h2 className="text-2xl font-bold text-center mb-4">CPU Nəsillər və Saylar</h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cpuChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 'auto']} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#FF6600" barSize={50} label={{ position: 'top', fill: 'black' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>


                <div className="w-full h-96 mt-20">
                    <h2 className="text-2xl font-bold text-center mb-4">Monitorlar</h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monitorChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 'auto']} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#45EBA5" barSize={50} label={{ position: 'top', fill: 'black' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-full h-[500px] flex flex-col items-center mt-20">
                    <h2 className="text-2xl font-bold text-center mb-4">Kompüter Kateqoriyaları üzrə Paylanma</h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={auditoryDeptPieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                outerRadius={200}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {auditoryDeptPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>


            </main>
            <footer className="bg-gray-800 text-white text-center py-4 mt-8">
                <p>Made by Ruhid © {new Date().getFullYear()}</p>
            </footer>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} data={modalData} loadingModalData={loadingModalData} />
        </div>
    );
}

export default Dashboard;