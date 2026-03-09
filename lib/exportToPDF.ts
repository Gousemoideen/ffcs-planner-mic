import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exports a given HTML element to PDF
 * @param elementId The ID of the HTML element to export
 * @param filename The name of the downloaded PDF file
 */
export const exportToPDF = async (elementId: string, filename: string = 'timetable.pdf') => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with ID ${elementId} not found`);
        return;
    }

    try {
        // Capture the element as a canvas
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#FFFAED',
            logging: false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const imgData = canvas.toDataURL('image/png');

        // PDF dimensions
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(filename);
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
};
