// Custom hook for managing building layout form state and operations

import { useState, useCallback, useMemo, ChangeEvent } from 'react';
import { BlockConfig, FloorConfig, Building, Flat, Schedule, INITIAL_BLOCK } from '../types/building';
import useAxiosPrivate from './useAxiosPrivate';
import { useNotification } from '../context/NotificationProvider';
import logger from '../utils/logger';

interface UseBuildingFormOptions {
    buildingId: string;
}

interface UseBuildingFormReturn {
    // State
    isLoading: boolean;
    error: string | null;
    isSaving: boolean;
    building: Building | null;
    isLayoutNew: boolean;
    formFields: BlockConfig[];
    activeBlockIndex: number;
    hasUnsavedChanges: boolean;
    cableNumbers: number[];
    currentCable: number | string;
    currentCableFlats: Flat[];
    schedules: Schedule;
    existingSchedules: Schedule[];

    // Actions
    fetchBuilding: () => Promise<void>;
    setActiveBlockIndex: (index: number) => void;
    handleFlatDetails: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number, parentIndex: number) => void;
    handleBlockType: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => void;
    handleFloors: (event: ChangeEvent<HTMLSelectElement>, index: number) => void;
    selectBlockType: (blockType: string) => void;
    addBlock: () => void;
    removeBlock: (index: number) => void;
    selectCable: (cableNumber: number) => void;
    submit: () => Promise<void>;
    updateSchedules: (updates: Partial<Schedule>) => void;
}

const useBuildingForm = ({ buildingId }: UseBuildingFormOptions): UseBuildingFormReturn => {
    const axiosPrivate = useAxiosPrivate();
    const { showSuccess, showError } = useNotification();

    // Loading and error states
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Building data
    const [building, setBuilding] = useState<Building | null>(null);
    const [isLayoutNew, setLayoutNew] = useState<boolean>(true);

    // Form state
    const [formFields, setFormFields] = useState<BlockConfig[]>([{ ...INITIAL_BLOCK }]);
    const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

    // Cable and schedule state
    const [currentCable, setCurrentCable] = useState<number | string>('');
    const [currentCableFlats, setCurrentCableFlats] = useState<Flat[]>([]);
    const [schedules, setSchedules] = useState<Schedule>({});
    const [existingSchedules, setExistingSchedules] = useState<Schedule[]>([]);

    const fetchBuilding = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await axiosPrivate.get<Building>(`/api/building/${buildingId}`);
            setBuilding(data);
            if (data.layout?.blocks?.length) {
                setFormFields(data.layout.blocks);
                setLayoutNew(false);
            }
            if (data.schedules?.length) {
                setExistingSchedules(data.schedules);
            }
            setHasUnsavedChanges(false);
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            logger.error('Failed to fetch building:', err);
            setError(error.response?.data?.message || 'Failed to load building data');
        } finally {
            setIsLoading(false);
        }
    }, [buildingId, axiosPrivate]);

    // Calculate cable numbers automatically
    const cableNumbers = useMemo(() => {
        const cables = new Set<number>();
        formFields.forEach((field) => {
            field.floors?.forEach((floor) => {
                if (floor.cableNumber) cables.add(floor.cableNumber);
            });
        });
        return Array.from(cables).sort((a, b) => a - b);
    }, [formFields]);

    // Select cable and find connected flats
    const selectCable = useCallback(
        (cableNumber: number): void => {
            setCurrentCable(cableNumber);
            const flatIds: string[] = [];
            const flatDetails: Flat[] = [];
            formFields.forEach((block) => {
                block.floors?.forEach((floor) => {
                    if (floor.cableNumber === cableNumber && floor.flat) {
                        flatIds.push(floor.flat);
                        const flatInfo = building?.flats?.find((f) => f._id === floor.flat);
                        if (flatInfo) {
                            flatDetails.push(flatInfo);
                        }
                    }
                });
            });
            setCurrentCableFlats(flatDetails);
            setSchedules((prev) => ({ ...prev, cableNumber, flats: flatIds }));
        },
        [formFields, building?.flats]
    );

    const handleFlatDetails = useCallback((
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        index: number,
        parentIndex: number
    ): void => {
        const { name, value } = event.target;
        const newValue = name === 'cableNumber' || name === 'cableLength' ? parseInt(value, 10) : value;

        setFormFields((prevFields) =>
            prevFields.map((block, bIdx) => {
                if (bIdx !== parentIndex) return block;
                return {
                    ...block,
                    floors: block.floors.map((floor, fIdx) => {
                        if (fIdx !== index) return floor;
                        return { ...floor, [name]: newValue };
                    }),
                };
            })
        );
        setHasUnsavedChanges(true);
    }, []);

    const handleBlockType = useCallback((
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        index: number
    ): void => {
        const { name, value } = event.target;
        setFormFields((prevFields) =>
            prevFields.map((block, idx) => {
                if (idx !== index) return block;

                let floors = block.floors;
                if (block.blockType && !isNaN(Number(block.topFloor))) {
                    const tempArray: FloorConfig[] = [];
                    for (let i = block.firstFloor; i <= Number(block.topFloor); i++) {
                        tempArray.push({ floor: i });
                    }
                    floors = tempArray;
                }

                return { ...block, [name]: value, floors };
            })
        );
        setHasUnsavedChanges(true);
    }, []);

    const selectBlockType = useCallback((blockType: string): void => {
        setFormFields((prevFields) =>
            prevFields.map((block, idx) => {
                if (idx !== activeBlockIndex) return block;

                let floors = block.floors;
                if (!isNaN(Number(block.topFloor))) {
                    const tempArray: FloorConfig[] = [];
                    for (let i = block.firstFloor; i <= Number(block.topFloor); i++) {
                        tempArray.push({ floor: i });
                    }
                    floors = tempArray;
                }

                return { ...block, blockType, floors };
            })
        );
        setHasUnsavedChanges(true);
    }, [activeBlockIndex]);

    const handleFloors = useCallback((
        event: ChangeEvent<HTMLSelectElement>,
        index: number
    ): void => {
        const { name, value } = event.target;
        const numValue = Number(value);

        setFormFields((prevFields) =>
            prevFields.map((block, idx) => {
                if (idx !== index) return block;

                const updatedBlock = { ...block, [name]: numValue };
                const firstFloor = name === 'firstFloor' ? numValue : block.firstFloor;
                const topFloor = name === 'topFloor' ? numValue : Number(block.topFloor);

                if (!isNaN(topFloor) && !isNaN(firstFloor)) {
                    const tempArray: FloorConfig[] = [];
                    for (let i = firstFloor; i <= topFloor; i++) {
                        tempArray.push({ floor: i });
                    }
                    updatedBlock.floors = tempArray;
                }

                return updatedBlock;
            })
        );
        setHasUnsavedChanges(true);
    }, []);

    const addBlock = useCallback((): void => {
        setFormFields((prev) => [...prev, { ...INITIAL_BLOCK }]);
    }, []);

    const removeBlock = useCallback((index: number): void => {
        setFormFields((prev) => prev.filter((_, i) => i !== index));
        if (activeBlockIndex >= formFields.length - 1) {
            setActiveBlockIndex(Math.max(0, formFields.length - 2));
        }
        setHasUnsavedChanges(true);
    }, [activeBlockIndex, formFields.length]);

    const submit = useCallback(async (): Promise<void> => {
        // Validation
        const hasInvalidBlocks = formFields.some((field) => !field.blockType || field.topFloor === '');
        if (hasInvalidBlocks) {
            showError('Please complete all block configurations before saving.');
            return;
        }

        setIsSaving(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            if (isLayoutNew) {
                await axiosPrivate.post(`/api/building/layout/${buildingId}`, formFields, config);
                setLayoutNew(false);
                showSuccess('Layout created successfully!');
            } else {
                await axiosPrivate.put(`/api/building/layout/${buildingId}`, formFields, config);
                showSuccess('Layout updated successfully!');
            }
            setHasUnsavedChanges(false);
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            logger.error('Failed to save layout:', err);
            showError(error.response?.data?.message || 'Failed to save layout. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }, [formFields, isLayoutNew, buildingId, axiosPrivate, showSuccess, showError]);

    const updateSchedules = useCallback((updates: Partial<Schedule>): void => {
        setSchedules((prev) => ({ ...prev, ...updates }));
    }, []);

    return {
        // State
        isLoading,
        error,
        isSaving,
        building,
        isLayoutNew,
        formFields,
        activeBlockIndex,
        hasUnsavedChanges,
        cableNumbers,
        currentCable,
        currentCableFlats,
        schedules,
        existingSchedules,

        // Actions
        fetchBuilding,
        setActiveBlockIndex,
        handleFlatDetails,
        handleBlockType,
        handleFloors,
        selectBlockType,
        addBlock,
        removeBlock,
        selectCable,
        submit,
        updateSchedules,
    };
};

export default useBuildingForm;
