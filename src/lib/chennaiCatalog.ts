import chennaiCourses from '@/data/all_data_chennai';
import type { fullCourseData } from '@/lib/type';

export type ChennaiCourseRecord = (typeof chennaiCourses)[number];

export type ChennaiDomainCatalog = Record<string, Record<string, ChennaiCourseRecord[]>>;

function getDepartmentPrefix(courseCode: string): string {
    const match = courseCode.match(/^[A-Z]+/);
    return match?.[0] || courseCode;
}

function normalizeCourseType(courseType: string): 'th' | 'lab' | 'both' {
    switch (courseType.toUpperCase()) {
        case 'LO':
            return 'lab';
        case 'PJT':
            return 'th';
        default:
            return 'th';
    }
}

export function buildChennaiCatalog(records: readonly ChennaiCourseRecord[] = chennaiCourses): ChennaiDomainCatalog {
    const catalog: ChennaiDomainCatalog = {};

    records.forEach((record) => {
        const domain = getDepartmentPrefix(record.CODE);
        const subject = `${record.CODE} - ${record.TITLE}`;

        catalog[domain] ||= {};
        catalog[domain][subject] ||= [];
        catalog[domain][subject].push(record);
    });

    return Object.fromEntries(
        Object.entries(catalog)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([domain, subjects]) => [
                domain,
                Object.fromEntries(
                    Object.entries(subjects)
                        .sort(([left], [right]) => left.localeCompare(right))
                        .map(([subject, subjectRecords]) => [subject, subjectRecords])
                ),
            ])
    );
}

export const chennaiCatalog = buildChennaiCatalog();

export const chennaiDepartments = Object.keys(chennaiCatalog);

export function getChennaiDepartmentData(selectedDepartments: string[]): ChennaiDomainCatalog {
    if (selectedDepartments.length === 0) {
        return chennaiCatalog;
    }

    return selectedDepartments.reduce<ChennaiDomainCatalog>((combined, department) => {
        const domainData = chennaiCatalog[department];
        if (!domainData) {
            return combined;
        }

        combined[department] ||= {};
        Object.entries(domainData).forEach(([subject, subjectRecords]) => {
            combined[department][subject] = [...subjectRecords];
        });

        return combined;
    }, {});
}

export function toFullCourseType(courseType: string): 'th' | 'lab' | 'both' {
    return normalizeCourseType(courseType);
}

export function getChennaiCourseType(courseCode: string): 'th' | 'lab' | 'both' {
    const matchingRecords = chennaiCourses.filter((course) => course.CODE === courseCode);

    if (matchingRecords.length === 0) {
        return 'th';
    }

    let hasTheory = false;
    let hasLab = false;

    matchingRecords.forEach((record) => {
        const normalizedType = record.TYPE.trim().toUpperCase();
        if (normalizedType === 'LO' || normalizedType === 'ELA') {
            hasLab = true;
        } else {
            hasTheory = true;
        }
    });

    if (hasTheory && hasLab) return 'both';
    if (hasLab) return 'lab';
    return 'th';
}

export function buildPreferenceCoursesFromChennaiSelection(
    selectedDomains: string[],
    selectedSubjects: string[],
    selectedSlots: string[],
    selectedFaculties: string[],
): fullCourseData[] {
    const courseEntries: fullCourseData[] = [];
    const selectedDepartmentData = getChennaiDepartmentData(selectedDomains);

    selectedDomains.forEach((domain) => {
        const subjectMap = selectedDepartmentData[domain] || {};

        selectedSubjects.forEach((subject) => {
            const subjectRecords = subjectMap[subject] || [];
            const slotFacultyMap = new Map<string, Set<string>>();

            subjectRecords.forEach((record) => {
                if (!selectedSlots.includes(record.SLOT) || !selectedFaculties.includes(record.FACULTY)) {
                    return;
                }

                if (!slotFacultyMap.has(record.SLOT)) {
                    slotFacultyMap.set(record.SLOT, new Set());
                }

                slotFacultyMap.get(record.SLOT)!.add(record.FACULTY);
            });

            if (slotFacultyMap.size === 0) {
                return;
            }

            const [courseCode, ...courseNameParts] = subject.split(' - ');
            const courseName = courseNameParts.join(' - ') || subject;

            courseEntries.push({
                id: `${courseCode}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                courseType: toFullCourseType(subjectRecords[0]?.TYPE || domain),
                courseCode,
                courseName,
                courseSlots: Array.from(slotFacultyMap.entries()).map(([slotName, faculties]) => ({
                    slotName,
                    slotFaculties: Array.from(faculties).map((facultyName) => ({ facultyName })),
                })),
            });
        });
    });

    return courseEntries;
}
