import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { companySettings, ticketSettings, users as mockUsers, systemSettings } from '../data/mockSettings';

export const useSettings = (user) => {
    const [settings, setSettings] = useState({
        company: {},
        ticket: {},
        system: {},
        users: []
    });
    const [loading, setLoading] = useState(true);

    const loadSettings = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const settingsData = await api.getSettings();
            const serverSettings = settingsData.data || {};

            let usersData = [];
            if (user.role === 'ADMIN') {
                try {
                    const usersResponse = await api.getUsers();
                    usersData = usersResponse.data;
                } catch (err) {
                    console.warn("Could not load users:", err);
                }
            }

            const mergedSettings = {
                company: { ...companySettings, ...serverSettings.company },
                ticket: { ...ticketSettings, ...serverSettings.ticket },
                system: { ...systemSettings, ...serverSettings.system },
                users: usersData.length > 0 ? usersData : (user.role === 'ADMIN' ? mockUsers : [])
            };
            setSettings(mergedSettings);

        } catch (error) {
            console.error("Error loading settings:", error);
            // Fallback
            setSettings({
                company: { ...companySettings, fantasyName: 'TecniWorld' },
                ticket: { ...ticketSettings },
                system: { ...systemSettings, minStock: 5, taxRate: 19 },
                users: [...mockUsers]
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [user]);

    const updateSettings = async (newSettings) => {
        setSettings(newSettings); // Optimitisc
        try {
            await api.updateSetting('company', newSettings.company);
            await api.updateSetting('ticket', newSettings.ticket);
            await api.updateSetting('system', newSettings.system);
            return true;
        } catch (error) {
            console.error("Error saving settings:", error);
            throw error;
        }
    };

    const createUser = async (userData) => {
        try {
            await api.createUser(userData);
            await loadSettings(); // Refresh (including users)
            return true;
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    };

    const deleteUser = async (userId) => {
        try {
            await api.deleteUser(userId);
            await loadSettings();
            return true;
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    };

    return {
        settings,
        updateSettings,
        createUser,
        deleteUser,
        loading
    };
};
