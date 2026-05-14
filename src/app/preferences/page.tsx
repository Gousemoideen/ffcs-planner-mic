'use client';

/**
 * PREFERENCES PAGE — Multi-step wizard for timetable creation
 *
 * Flow: Landing → Login → Create New Timetable → **Preferences** → Courses → Timetable → Saved
 *
 * PURPOSE:
 * The user completes a 5-step wizard to set their preferences:
 *   1. Select Domain (e.g., BACSE, BAECE, BAEIE)
 *   2. Select Subject (specific courses from the selected domain)
 *   3. Select Slot (available time slots for the course)
 *   4. Select Faculty (professor for the course)
 *   5. Faculty Priority (set priority for faculty selection)
 *
 * DATABASE INTERACTIONS:
 * - No direct DB writes on this page
 * - Reads course catalog data from static data files
 * - Selected preferences are stored in PreferencesContext
 *
 * DATA FLOW:
 * - Input: Course catalog data (static imports from /data)
 * - Output: fullCourseData[] → passed to /courses page via context
 * - Uses: lib/PreferencesContext.tsx (state management)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePreferences } from '@/lib/PreferencesContext';
import { fullCourseData } from '@/lib/type';
import { getPlannerStoredValue, setPlannerStoredValue } from '@/lib/plannerStorage';
import type { ChennaiDomainCatalog } from '@/lib/chennaiCatalog';
import {
    buildPreferenceCoursesFromChennaiSelection,
    getChennaiDepartmentData,
} from '@/lib/chennaiCatalog';

// Cookie utility functions
const setCookie = (name: string, value: string, days = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
};

const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

const getCookie = (name: string): string | null => {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }
    return null;
};

const keepFirst = (arr: string[]): string[] => (arr.length > 0 ? [arr[0]] : []);

const STEP_COLORS = ['#9bc0f6', '#eedaff', '#d1fae5', '#9bc0f6', '#eedaff'];
const STEP_BORDER_COLORS = ['#759fdf', '#bfa1eb', '#9dcbb5', '#759fdf', '#bfa1eb'];
const STEP_LABELS = [
    'Select Domain',
    'Select Subject',
    'Select Slot',
    'Select Faculty',
    'Faculty Priority',
];

const selectionButtonClass = 'w-full p-3 lg:p-4 rounded-lg text-left font-semibold transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:bg-white';
const selectionButtonSelectedClass = 'bg-white ring-2 ring-blue-500 shadow-md';
const selectionButtonUnselectedClass = 'bg-white/80 hover:bg-white hover:shadow-sm';

export default function PreferencesPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { addCourse, updateCourse } = usePreferences();

    const itemRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

    const [currentStep, setCurrentStep] = useState(1);
    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
    const [savedFacultyPreferences, setSavedFacultyPreferences] = useState<string[]>([]);
    const [facultyPriority, setFacultyPriority] = useState<'slot' | 'faculty'>('slot');
    const [isVisible, setIsVisible] = useState(false);
    const [selectionError, setSelectionError] = useState('');

    const moveFacultyUp = (index: number) => {
        if (index === 0) return;
        const updated = [...savedFacultyPreferences];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        setSavedFacultyPreferences(updated);
    };

    const moveFacultyDown = (index: number) => {
        if (index === savedFacultyPreferences.length - 1) return;
        const updated = [...savedFacultyPreferences];
        [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
        setSavedFacultyPreferences(updated);
    };
    // Load preferences from cookies on mount
    useEffect(() => {
        const timer = window.setTimeout(() => {
            const savedStep = getCookie('preferenceStep');
            const savedDomains = getCookie('preferenceDomains');
            const savedSubjects = getCookie('preferenceSubjects');
            const savedSlots = getCookie('preferenceSlots');
            const savedFaculties = getPlannerStoredValue('preferenceMultipleFaculties');
            const savedPriority = getCookie('facultyPriority');

            if (savedStep) {
                const parsedStep = Number.parseInt(savedStep, 10);
                if (!Number.isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 5) {
                    setCurrentStep(parsedStep);
                }
            }
            if (savedDomains) {
                const parsed = JSON.parse(savedDomains);
                setSelectedDomains(keepFirst(Array.isArray(parsed) ? parsed : []));
            }
            if (savedSubjects) {
                const parsed = JSON.parse(savedSubjects);
                setSelectedSubjects(keepFirst(Array.isArray(parsed) ? parsed : []));
            }
            if (savedSlots) setSelectedSlots(JSON.parse(savedSlots));
            if (savedFaculties) setSavedFacultyPreferences(JSON.parse(savedFaculties));
            if (savedPriority) setFacultyPriority(savedPriority as 'slot' | 'faculty');
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    // Save preferences to cookies whenever they change
    useEffect(() => {
        setCookie('preferenceStep', currentStep.toString());
        setCookie('preferenceDomains', JSON.stringify(selectedDomains));
        setCookie('preferenceSubjects', JSON.stringify(selectedSubjects));
        setCookie('preferenceSlots', JSON.stringify(selectedSlots));
        setCookie('facultyPriority', facultyPriority);
    }, [currentStep, selectedDomains, selectedSubjects, selectedSlots, facultyPriority]);

    useEffect(() => {
        setPlannerStoredValue('preferenceMultipleFaculties', JSON.stringify(savedFacultyPreferences));
    }, [savedFacultyPreferences]);

    useEffect(() => {
        const timer = window.setTimeout(() => setIsVisible(true), 40);
        return () => window.clearTimeout(timer);
    }, []);



    // Load Chennai domain data dynamically
    const domainData = useMemo<ChennaiDomainCatalog>(() => {
        return getChennaiDepartmentData(selectedDomains);
    }, [selectedDomains]);

    // Get available domains (course prefixes)
    const domains = useMemo(() => {
        return Object.keys(getChennaiDepartmentData([]));
    }, []);

    // Get subjects in selected domain
    const subjects = useMemo(() => {
        if (selectedDomains.length === 0 || !domainData) return [];
        const allSubjects = selectedDomains.flatMap((domain) => Object.keys(domainData[domain] ?? {}));
        return [...new Set(allSubjects)];
    }, [selectedDomains, domainData]);

    // Get slots for selected subject
    const slots = useMemo(() => {
        if (selectedSubjects.length === 0 || selectedDomains.length === 0 || !domainData) return [];
        const slotSet = new Set<string>();
        selectedDomains.forEach(domain => {
            const subjectMap = domainData[domain] || {};
            selectedSubjects.forEach(subject => {
                const subjectData = subjectMap[subject] || [];
                subjectData.forEach((item) => {
                    if (item.SLOT) slotSet.add(item.SLOT);
                });
            });
        });
        return Array.from(slotSet);
    }, [selectedSubjects, selectedDomains, domainData]);

    // Slot type map: theory (ETH/TH) vs lab (ELA/LO) — used for labels in Step 3
    const slotTypes = useMemo<Record<string, 'theory' | 'lab' | 'other'>>(() => {
        if (selectedSubjects.length === 0 || selectedDomains.length === 0 || !domainData) return {};
        const map: Record<string, 'theory' | 'lab' | 'other'> = {};
        selectedDomains.forEach(domain => {
            const subjectMap = domainData[domain] || {};
            selectedSubjects.forEach(subject => {
                const items = subjectMap[subject] || [];
                items.forEach(item => {
                    if (!item.SLOT) return;
                    const t = item.TYPE.toUpperCase().trim();
                    if (['ETH', 'TH', 'PJT', 'SS', 'OC', 'EPJ'].includes(t)) {
                        map[item.SLOT] = 'theory';
                    } else if (['ELA', 'LO'].includes(t)) {
                        map[item.SLOT] = map[item.SLOT] === 'theory' ? 'theory' : 'lab';
                    } else {
                        map[item.SLOT] = map[item.SLOT] || 'other';
                    }
                });
            });
        });
        return map;
    }, [selectedSubjects, selectedDomains, domainData]);

    // Get faculties for selected slot
    const faculties = useMemo<string[]>(() => {
        if (selectedSubjects.length === 0 || selectedDomains.length === 0 || selectedSlots.length === 0 || !domainData) return [];
        const facultySet = new Set<string>();

        selectedDomains.forEach(domain => {
            const subjectMap = domainData[domain] || {};
            selectedSubjects.forEach(subject => {
                const subjectData = subjectMap[subject] || [];
                subjectData.forEach((item) => {
                    if (selectedSlots.includes(item.SLOT)) {
                        if (item.FACULTY) facultySet.add(item.FACULTY);
                    }
                });
            });
        });

        return Array.from(facultySet);
    }, [selectedSubjects, selectedDomains, selectedSlots, domainData]);

    // Keyboard navigation to scroll to items starting with pressed key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const key = e.key.toLowerCase();
            let itemsToSearch: string[] = [];
            if (currentStep === 1) itemsToSearch = domains;
            else if (currentStep === 2) itemsToSearch = subjects;
            else if (currentStep === 3) itemsToSearch = slots;
            else if (currentStep === 4) itemsToSearch = faculties;

            if (key === 'enter' && currentStep === 4) {
                if (selectedFaculties.length > 0) {
                    e.preventDefault();
                    // Mirror exactly what handleNext() does for Step 4
                    const persisted = persistCurrentSelection(false);
                    if (persisted) setCurrentStep(5);
                }
                return;
            }

            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                if (itemsToSearch.length === 0) return;
                e.preventDefault();
                
                const activeElement = document.activeElement as HTMLButtonElement;
                const currentIndex = itemsToSearch.findIndex(item => itemRefs.current[item] === activeElement);
                let nextIndex = 0;

                if (currentIndex !== -1) {
                    if (key === 'arrowdown' || key === 'arrowright') {
                        nextIndex = Math.min(itemsToSearch.length - 1, currentIndex + 1);
                    } else if (key === 'arrowup' || key === 'arrowleft') {
                        nextIndex = Math.max(0, currentIndex - 1);
                    }
                }
                
                const targetItem = itemsToSearch[nextIndex];
                if (targetItem && itemRefs.current[targetItem]) {
                    itemRefs.current[targetItem].focus();
                    itemRefs.current[targetItem].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    
                    if (currentStep === 1) handleDomainSelect(targetItem, false);
                    else if (currentStep === 2) handleSubjectSelect(targetItem, false);
                    else if (currentStep === 3) handleSlotSelect(targetItem, false);
                    else if (currentStep === 4) handleFacultySelect(targetItem, false);
                }
                return;
            }

            if (key.length === 1 && /[a-z]/.test(key)) {
                const targetItem = itemsToSearch.find(item => item.toLowerCase().startsWith(key));
                if (targetItem && itemRefs.current[targetItem]) {
                    itemRefs.current[targetItem].focus();
                    itemRefs.current[targetItem].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    
                    if (currentStep === 1) handleDomainSelect(targetItem, false);
                    else if (currentStep === 2) handleSubjectSelect(targetItem, false);
                    else if (currentStep === 3) handleSlotSelect(targetItem, false);
                    else if (currentStep === 4) handleFacultySelect(targetItem, false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentStep, domains, subjects, slots, faculties, selectedFaculties]);

    const handleNext = () => {
        if (currentStep === 4) {
            const persisted = persistCurrentSelection(false);
            if (persisted) {
                setCurrentStep(5);
            }
            return;
        }

        if (currentStep < 5) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleStepClick = (stepNum: number) => {
        if (stepNum >= 1 && stepNum <= 5) {
            setCurrentStep(stepNum);
        }
    };

    const handleAddAnotherProfessor = () => {
        setSelectionError('');
        setSelectedSubjects([]);
        setSelectedSlots([]);
        setSelectedFaculties([]);
        setCurrentStep(2);
        setCookie('preferenceStep', '2');
    };

    const handleDomainSelect = (domain: string, autoAdvance = true) => {
        setSelectionError('');
        
        setSelectedDomains([domain]);
        
        if (selectedDomains[0] !== domain) {
            setSelectedSubjects([]);
            setSelectedSlots([]);
            setSelectedFaculties([]);
        }

        if (autoAdvance) {
            setTimeout(() => setCurrentStep(2), 200);
        }
    };

    const handleSubjectSelect = (subject: string, autoAdvance = true) => {
        setSelectionError('');
        
        setSelectedSubjects([subject]);
        
        if (selectedSubjects[0] !== subject) {
            setSelectedSlots([]);
            setSelectedFaculties([]);
        }

        if (autoAdvance) {
            setTimeout(() => setCurrentStep(3), 200);
        }
    };

    const handleSlotSelect = (slot: string, autoAdvance = true) => {
        setSelectionError('');
        setSelectedSlots([slot]);
        
        if (selectedSlots[0] !== slot) {
            setSelectedFaculties([]);
        }

        if (autoAdvance) {
            setTimeout(() => setCurrentStep(4), 200);
        }
    };

    const handleFacultySelect = (faculty: string, autoAdvance = true) => {
        setSelectionError('');
        
        if (!autoAdvance) {
            // Keyboard navigation: strictly single-select to keep the "one selection" visual
            setSelectedFaculties([faculty]);
        } else {
            // Mouse click or manual Enter: toggle multi-select
            setSelectedFaculties(prev =>
                prev.includes(faculty) ? prev.filter(f => f !== faculty) : [...prev, faculty]
            );
            
            // If the user hits Enter on a button that's already selected, it could mean they want to proceed.
            // But for now, let's just let them toggle. 
            // If autoAdvance is true and they are in Step 4, handleNext() was previously called.
            // Let's only auto-advance if they press Next or if we want to be aggressive.
            // The user said: "if the user clicks two or more faculty... let them move to the next section"
            // I'll leave the auto-advance for faculty selection to be manual (via Next button) 
            // OR we can make it so that if they've selected some and click an already selected one, it advances?
            // Actually, let's keep it simple: manual Next for multi-select.
        }
    };

    const persistCurrentSelection = (resetWizard = true) => {
        if (selectedSubjects.length > 0 && selectedSlots.length > 0 && selectedFaculties.length > 0) {
            setSelectionError('');
            const newCourses = buildPreferenceCoursesFromChennaiSelection(
                selectedDomains,
                selectedSubjects,
                selectedSlots,
                selectedFaculties,
            );

            if (newCourses.length > 0) {
                let existingCourses: fullCourseData[] = [];

                try {
                    const existingCoursesRaw = getPlannerStoredValue('preferenceCourses');
                    existingCourses = existingCoursesRaw ? JSON.parse(existingCoursesRaw) : [];
                } catch (error) {
                    console.error('Error reading preferenceCourses cookie:', error);
                }

                const existingEntries = new Set(
                    existingCourses.flatMap(course =>
                        course.courseSlots.flatMap(courseSlot =>
                            courseSlot.slotFaculties.map(faculty => `${course.courseCode}||${courseSlot.slotName}||${faculty.facultyName}`)
                        )
                    )
                );

                const duplicateEntry = newCourses.flatMap(course =>
                    course.courseSlots.flatMap(courseSlot =>
                        courseSlot.slotFaculties.map(faculty => ({
                            key: `${course.courseCode}||${courseSlot.slotName}||${faculty.facultyName}`,
                            courseCode: course.courseCode,
                            courseName: course.courseName,
                            slotName: courseSlot.slotName,
                            facultyName: faculty.facultyName,
                        }))
                    )
                ).find(entry => existingEntries.has(entry.key));

                if (duplicateEntry) {
                    setSelectionError(
                        `${duplicateEntry.facultyName} is already added for ${duplicateEntry.courseCode} (${duplicateEntry.slotName}).`
                    );
                    return false;
                }

                // Merge-on-add: if adding a lab entry for a course that already has a theory entry
                // (or vice versa), merge them into a single 'both' entry.
                const finalNewCourses: fullCourseData[] = [];
                let mergedExistingCourses = [...existingCourses];

                for (const newCourse of newCourses) {
                    if (newCourse.courseType === 'lab') {
                        const theoryIdx = mergedExistingCourses.findIndex(
                            c => c.courseCode === newCourse.courseCode && (c.courseType === 'th' || c.courseType === 'both')
                        );
                        if (theoryIdx !== -1) {
                            const theoryCourse = mergedExistingCourses[theoryIdx];
                            const labSlot = newCourse.courseSlots[0];
                            if (labSlot) {
                                const mergedCourse: fullCourseData = {
                                    ...theoryCourse,
                                    courseType: 'both',
                                    courseCodeLab: newCourse.courseCode,
                                    courseNameLab: newCourse.courseName,
                                    courseSlots: theoryCourse.courseSlots.map(cs => ({
                                        ...cs,
                                        slotFaculties: cs.slotFaculties.map(f => {
                                            const match = labSlot.slotFaculties.find(lf => lf.facultyName === f.facultyName);
                                            return match ? { ...f, facultyLabSlot: labSlot.slotName } : f;
                                        }),
                                    })),
                                };
                                mergedExistingCourses = [
                                    ...mergedExistingCourses.slice(0, theoryIdx),
                                    mergedCourse,
                                    ...mergedExistingCourses.slice(theoryIdx + 1),
                                ];
                                updateCourse(theoryCourse.courseCode, mergedCourse);
                                continue; // Skip adding lab as separate entry
                            }
                        }
                    } else if (newCourse.courseType === 'th') {
                        const labIdx = mergedExistingCourses.findIndex(
                            c => c.courseCode === newCourse.courseCode && c.courseType === 'lab'
                        );
                        if (labIdx !== -1) {
                            const labCourse = mergedExistingCourses[labIdx];
                            const labSlot = labCourse.courseSlots[0];
                            if (labSlot) {
                                const mergedCourse: fullCourseData = {
                                    ...newCourse,
                                    courseType: 'both',
                                    courseCodeLab: labCourse.courseCode,
                                    courseNameLab: labCourse.courseName,
                                    courseSlots: newCourse.courseSlots.map(cs => ({
                                        ...cs,
                                        slotFaculties: cs.slotFaculties.map(f => {
                                            const match = labSlot.slotFaculties.find(lf => lf.facultyName === f.facultyName);
                                            return match ? { ...f, facultyLabSlot: labSlot.slotName } : f;
                                        }),
                                    })),
                                };
                                // Remove old lab entry, add merged theory entry
                                mergedExistingCourses = mergedExistingCourses.filter((_, i) => i !== labIdx);
                                mergedExistingCourses.push(mergedCourse);
                                addCourse(mergedCourse); // context: add merged (lab entry will be removed next)
                                updateCourse(labCourse.courseCode, mergedCourse);
                                continue;
                            }
                        }
                    }
                    finalNewCourses.push(newCourse);
                }

                finalNewCourses.forEach(c => addCourse(c));

                try {
                    let updatedExistingCourses = [...mergedExistingCourses];

                    finalNewCourses.forEach(course => {
                        updatedExistingCourses = updatedExistingCourses.filter(existing => existing.id !== course.id);
                        updatedExistingCourses.push(course);
                    });

                    setPlannerStoredValue('preferenceCourses', JSON.stringify(updatedExistingCourses));
                } catch (error) {
                    console.error('Error saving preferenceCourses cookie:', error);
                    setPlannerStoredValue('preferenceCourses', JSON.stringify(finalNewCourses));
                }

                setSavedFacultyPreferences(prev => {
                    const merged = [...prev];
                    selectedFaculties.forEach(faculty => {
                        if (!merged.includes(faculty)) {
                            merged.push(faculty);
                        }
                    });
                    return merged;
                });
            }

            if (resetWizard) {
                setSelectedSubjects([]);
                setSelectedSlots([]);
                setSelectedFaculties([]);
                setCurrentStep(1);
            } else {
                setSelectedFaculties([]);
            }

            return true;
        }

        return false;
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return selectedDomains.length > 0;
            case 2:
                return selectedSubjects.length > 0;
            case 3:
                return selectedSlots.length > 0;
            case 4:
                return selectedFaculties.length > 0;
            case 5:
                return savedFacultyPreferences.length > 0;
            default:
                return false;
        }
    };

    return (
        <>
        <div className={`h-screen bg-[#F5E6D3] font-sans overflow-hidden transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="h-full px-[clamp(12px,1.5vw,24px)] pt-[clamp(10px,1vh,18px)] pb-29">
                <div className="w-full max-w-450 h-full mx-auto flex flex-col min-h-0">
                    <div className="flex items-center gap-4 px-2 pt-6 pb-3 shrink-0">
                        <h1 className="text-[26px] lg:text-3xl font-bold text-black animate-lucid-fade-up">Select Your Preferences</h1>
                    </div>

                    <div className="flex-1 min-h-0 bg-white rounded-[18px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white overflow-hidden px-4 py-4 lg:px-6 lg:py-5 animate-lucid-fade-up-delayed">
                            <div className="flex items-stretch gap-[clamp(8px,0.9vw,16px)] h-full min-h-0 min-w-0 overflow-hidden" style={{ scrollBehavior: 'smooth' }}>
                        {/* Step Panels */}
                        {[1, 2, 3, 4, 5].map(stepNum => (
                            <div
                                key={stepNum}
                                onClick={stepNum === currentStep ? undefined : () => handleStepClick(stepNum)}
                                className={`rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden shrink-0 ${
  stepNum === currentStep
    ? 'flex-[2.8] min-w-70 max-w-117.5'
    : 'flex-1 min-w-14.5'
}`}
                                style={{ backgroundColor: STEP_COLORS[stepNum - 1] }}
                            >
                            {stepNum === currentStep ? (
                                <div key={`active-step-${currentStep}`} className="w-full h-full flex flex-col px-2 lg:px-4 pt-4 pb-3 overflow-hidden bg-white/10 backdrop-blur-sm rounded-2xl animate-lucid-panel-in">
                                    <div 
                                        className="flex items-center justify-center shrink-0 border-b-4 pb-3 mb-3 px-2 lg:-mx-4 lg:px-4"
                                        style={{ borderBottomColor: STEP_BORDER_COLORS[stepNum - 1] }}
                                    >
                                        <h2 className="text-[16px] lg:text-[28px] font-bold text-black m-0 leading-none text-center">
                                            {stepNum}. {STEP_LABELS[stepNum - 1]}
                                        </h2>
                                    </div>

                                    <div className="flex-1 bg-transparent p-1 lg:p-3 overflow-y-auto custom-scrollbar flex flex-col">
                                        {selectionError && (
                                            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                                {selectionError}
                                            </div>
                                        )}
                                        {/* Step 1: Domain Selection */}
                                        {stepNum === 1 && (
                                            <div style={{ display: 'grid', gap: '10px' }}>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1">
                                                    Select one option
                                                </p>
                                                {domains.map(dept => (
                                                    <button
                                                        key={dept}
                                                        ref={(el) => { itemRefs.current[dept] = el; }}
                                                        onClick={() => handleDomainSelect(dept, false)}
                                                        className={`${selectionButtonClass} cursor-pointer ${selectedDomains.includes(dept)
                                                            ? selectionButtonSelectedClass
                                                            : selectionButtonUnselectedClass
                                                            }`}
                                                    >
                                                        {dept}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Step 2: Subject Selection */}
                                        {stepNum === 2 && (
                                            <div style={{ display: 'grid', gap: '10px' }}>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1">
                                                    Select one option
                                                </p>
                                                {subjects.length > 0 ? subjects.map(subject => (
                                                    <button
                                                        key={subject}
                                                        ref={(el) => { itemRefs.current[subject] = el; }}
                                                        onClick={() => handleSubjectSelect(subject, false)}
                                                        className={`${selectionButtonClass} cursor-pointer ${selectedSubjects.includes(subject)
                                                            ? selectionButtonSelectedClass
                                                            : selectionButtonUnselectedClass
                                                            }`}
                                                    >
                                                        <div className="font-mono font-bold text-sm">
                                                            {subject.split(' - ')[0]}
                                                        </div>
                                                        <div className="text-xs text-gray-700 mt-1">
                                                            {subject.split(' - ').slice(1).join(' - ')}
                                                        </div>
                                                    </button>
                                                )) : (
                                                    <div className="text-center text-gray-700 py-8">
                                                        Please select a domain first
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Step 3: Slot Selection */}
                                        {stepNum === 3 && (
                                            <div style={{ display: 'grid', gap: '10px' }}>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1">
                                                    Select one option
                                                </p>
                                                {slots.length > 0 ? slots.map(slot => {
                                                    const slotKind = slotTypes[slot];
                                                    return (
                                                        <button
                                                            key={slot}
                                                            ref={(el) => { itemRefs.current[slot] = el; }}
                                                            onClick={() => handleSlotSelect(slot, false)}
                                                            className={`${selectionButtonClass} ${selectedSlots.includes(slot)
                                                                ? selectionButtonSelectedClass
                                                                : selectionButtonUnselectedClass
                                                                } flex items-center justify-between`}
                                                        >
                                                            <span>{slot}</span>
                                                            {slotKind === 'theory' && (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 ml-2 shrink-0">
                                                                    Theory
                                                                </span>
                                                            )}
                                                            {slotKind === 'lab' && (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 ml-2 shrink-0">
                                                                    Lab
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                }) : (
                                                    <div className="text-center text-gray-700 py-8">
                                                        Please select a subject first
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Step 4: Faculty Selection */}
                                        {stepNum === 4 && (
                                            <div style={{ display: 'grid', gap: '10px' }}>
                                                <p className={`text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1 ${selectionError ? 'mt-1' : ''}`}>
                                                    Select one or more options
                                                </p>
                                                {faculties.length > 0 ? faculties.map((faculty, idx) => (
                                                    <button
                                                        key={idx}
                                                        ref={(el) => { itemRefs.current[faculty] = el; }}
                                                        onClick={() => handleFacultySelect(faculty)}
                                                        className={`${selectionButtonClass} ${selectedFaculties.includes(faculty)
                                                            ? selectionButtonSelectedClass
                                                            : selectionButtonUnselectedClass
                                                            }`}
                                                    >
                                                        {faculty}
                                                    </button>
                                                )) : (
                                                    <div className="text-center text-gray-700 py-8">
                                                        Please select a slot first
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Step 5: Faculty Priority */}
                                        {stepNum === 5 && (
                                            <div className="flex flex-col h-full">
                                                <p className="text-gray-800 font-medium mb-3">
                                                    Professors selected in Step 4 are auto-added:
                                                </p>

                                                <div className="bg-white/50 rounded-lg p-4 shadow-sm border border-white/60">
                                                    <p className="text-sm font-bold text-gray-800 mb-3">Your Faculty Preferences:</p>
                                                    {savedFacultyPreferences.length > 0 ? (
                                                        <div style={{ display: 'grid', gap: '8px' }}>
                                                            {savedFacultyPreferences.map((faculty, idx) => (
                                                                <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                                                    <span className="text-sm font-bold text-gray-900">{faculty}</span>
                                                                    <div className="flex gap-2 items-center">
                                                                        <button
                                                                            onClick={() => moveFacultyUp(idx)}
                                                                            disabled={idx === 0}
                                                                            className={`px-2 py-1 rounded border ${idx === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100"}`}
                                                                        >
                                                                            ↑
                                                                        </button>
                                                                        <button
                                                                            onClick={() => moveFacultyDown(idx)}
                                                                            disabled={idx === savedFacultyPreferences.length - 1}
                                                                            className={`px-2 py-1 rounded border ${idx === savedFacultyPreferences.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100"}`}
                                                                        >
                                                                            ↓
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const updated = savedFacultyPreferences.filter((_, i) => i !== idx);
                                                                                setSavedFacultyPreferences(updated);
                                                                            }}
                                                                            className="text-red-500 hover:text-red-700 font-bold ml-2 text-lg hover:bg-red-50 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-500">No faculty added yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}


                                    </div>

                                    {/* Navigation arrows within active panel */}
                                     <div className="flex justify-between mt-auto pt-3 shrink-0 px-1 pb-1">
                                         <button
                                             onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                                             disabled={currentStep === 1}
                                             className={`w-10 h-10 flex items-center justify-center rounded-[10px] bg-white text-gray-900 shadow-sm transition-all duration-200 ${currentStep === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}`}
                                         >
                                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                                         </button>
                                         
                                        {currentStep === 5 ? (
                                             <div className="flex w-full gap-2 px-2">
                                                 <button
                                                     onClick={(e) => { e.stopPropagation(); handleAddAnotherProfessor(); }}
                                                     title={'Reset to Step 2 and select another subject'}
                                                     className="flex-1 px-3 py-2 rounded-lg font-bold text-sm bg-white text-blue-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                                 >
                                                     + Add another
                                                 </button>
                                                 <button
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         router.push('/courses');
                                                     }}
                                                     title={'Save current preference and view all courses'}
                                                     className="flex-1 px-4 py-2 rounded-lg font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                                 >
                                                     Save & Continue →
                                                 </button>
                                             </div>
                                         ) : (
                                             <button
                                                 onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                                 disabled={!canProceed()}
                                                 className={`w-10 h-10 flex items-center justify-center rounded-[10px] bg-white text-gray-900 shadow-sm transition-all duration-200 cursor-pointer ${!canProceed() ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md'}`}
                                             >
                                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                             </button>
                                         )}
                                     </div>
                                 </div>
                             ) : (
                                 <div className="h-full flex flex-col items-center justify-center px-1 lg:px-2 py-5 lg:py-6">
                                     <span className="text-[1.9rem] font-bold text-black mb-3">{stepNum}</span>
                                     <div
                                         className="text-base lg:text-[18px] font-bold tracking-wide flex-1 flex items-center justify-center whitespace-nowrap"
                                        style={{
                                            writingMode: 'vertical-rl',
                                            textOrientation: 'mixed',
                                            transform: 'rotate(180deg)'
                                        }}
                                    >
                                        {STEP_LABELS[stepNum - 1]}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        </div>
        </div>

        {/* Bottom Navigation */}
        <div
            className="fixed bottom-0 left-0 right-0 z-40 bg-[#F5E6D3] py-6 px-[clamp(16px,2vw,32px)] w-full flex justify-center"
            style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}
        >
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 w-full">
                <div className="flex items-center justify-start gap-3 w-full sm:w-auto shrink-0">
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        aria-label="Go to home page"
                        title="Home"
                        className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-center min-w-14.5 min-h-14.5 hover:bg-gray-50 transition-colors shrink-0"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-6 h-6 text-gray-800"
                            aria-hidden="true"
                        >
                            <path d="M3 10.5L12 3l9 7.5" />
                            <path d="M5 9.5V21h14V9.5" />
                            <path d="M9 21v-6h6v6" />
                        </svg>
                    </button>

                    {/* LEFT - USER BOX */}
                    <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                            {session?.user?.image ? (
                                <Image src={session.user.image} alt="User avatar" width={36} height={36} className="w-9 h-9 rounded-lg border border-gray-100 shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="w-9 h-9 bg-gray-300 rounded-lg flex items-center justify-center font-bold text-white text-sm shrink-0">
                                {session?.user?.name?.[0] || "?"}
                            </div>
                        )}
                        <span className="text-gray-800 text-sm font-bold truncate max-w-50 pr-2">
                            {session?.user?.name || "Guest"}
                        </span>
                    </div>
                </div>

                {/* CENTER - STEPS BOX */}
                <div className="bg-white rounded-xl p-2 shadow-sm flex flex-wrap justify-center items-center gap-2 w-full sm:w-auto order-last md:order-0 mt-2 md:mt-0">
                    {[1, 2, 3, 4].map((num) => (
                        <button
                            key={num}
                            onClick={() => {
                                if (num === 1) router.push('/preferences');
                                if (num === 2) router.push('/courses');
                                if (num === 3) router.push('/timetable');
                                if (num === 4) router.push('/saved');
                            }}
                            className={`h-9.5 flex items-center justify-center rounded-md font-bold text-sm cursor-pointer transition-colors border-none ${
                                num === 1
                                    ? 'bg-[#A0C4FF] text-black px-4 min-w-9.5'
                                    : 'bg-[#A0C4FF]/40 text-black min-w-9.5'
                            }`}
                        >
                            {num === 1 ? '1. Preferences' : num}
                        </button>
                    ))}
                </div>

                {/* RIGHT - ACTION BOX */}
                <div className="flex gap-3 justify-end shrink-0 ml-auto mr-auto sm:mr-0 mt-2 sm:mt-0">
                    <button
                        onClick={() => {
                            deleteCookie('editingTimetableId');
                            router.push('/');
                        }}
                        className="px-8 py-3 bg-[#f1eacb] hover:bg-[#E8DDB8] border-2 border-[#A0C4FF] rounded-[10px] font-bold text-sm text-black transition-all duration-200"
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-10 py-3 bg-[#A0C4FF] hover:bg-[#90B4EF] rounded-[10px] font-bold text-sm text-black transition-all duration-200 cursor-pointer"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #ffffff;
                }

                @keyframes lucidFadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes lucidPanelIn {
                    from { opacity: 0; transform: translateX(8px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .animate-lucid-fade-up {
                    animation: lucidFadeUp 420ms ease-out;
                }

                .animate-lucid-fade-up-delayed {
                    animation: lucidFadeUp 560ms ease-out;
                }

                .animate-lucid-panel-in {
                    animation: lucidPanelIn 280ms ease-out;
                }
            `}</style>
        </>
    );
}
