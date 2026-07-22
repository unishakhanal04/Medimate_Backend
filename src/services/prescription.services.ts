import { PrescriptionRepository } from "../repositories/prescription.repository";
import { HttpException } from "../exceptions/http-exception";
import { IPrescription, CreatePrescriptionDTO, UpdatePrescriptionDTO } from "../types/prescription.type";

const isExpired = (prescription: IPrescription, now: Date) => {
  return Boolean(prescription.expiryDate && new Date(prescription.expiryDate) < now);
};

export const PrescriptionService = {
  async createPrescription(userId: string, data: CreatePrescriptionDTO) {
    const prescriptionData: Omit<IPrescription, "_id" | "createdAt" | "updatedAt"> = {
      userId,
      title: data.title,
      doctorName: data.doctorName,
      hospital: data.hospital,
      prescriptionDate: new Date(data.prescriptionDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      diagnosis: data.diagnosis,
      reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
      medicines: data.medicines ?? [],
      notes: data.notes,
      attachmentUrl: data.attachmentUrl,
    };

    return await PrescriptionRepository.create(prescriptionData);
  },

  async getPrescriptionsByUserId(userId: string) {
    return await PrescriptionRepository.findByUserId(userId);
  },

  async getPrescriptionById(id: string, userId: string) {
    const prescription = await PrescriptionRepository.findById(id);
    if (!prescription) {
      throw new HttpException(404, "Prescription not found");
    }
    if (prescription.userId !== userId) {
      throw new HttpException(403, "Access denied");
    }
    return prescription;
  },

  async updatePrescription(id: string, userId: string, data: UpdatePrescriptionDTO) {
    await this.getPrescriptionById(id, userId);

    const updateData: Partial<IPrescription> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.doctorName !== undefined) updateData.doctorName = data.doctorName;
    if (data.hospital !== undefined) updateData.hospital = data.hospital;
    if (data.prescriptionDate !== undefined) updateData.prescriptionDate = new Date(data.prescriptionDate);
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis;
    if (data.reviewDate !== undefined) updateData.reviewDate = data.reviewDate ? new Date(data.reviewDate) : undefined;
    if (data.medicines !== undefined) updateData.medicines = data.medicines;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.attachmentUrl !== undefined) updateData.attachmentUrl = data.attachmentUrl;

    const updatedPrescription = await PrescriptionRepository.update(id, updateData);
    if (!updatedPrescription) {
      throw new HttpException(404, "Prescription not found");
    }
    return updatedPrescription;
  },

  async deletePrescription(id: string, userId: string) {
    await this.getPrescriptionById(id, userId);
    await PrescriptionRepository.deleteById(id);
  },

  async getActivePrescriptions(userId: string) {
    const prescriptions = await PrescriptionRepository.findByUserId(userId);
    const now = new Date();
    return prescriptions.filter((prescription) => !isExpired(prescription, now));
  },

  async getExpiredPrescriptions(userId: string) {
    const prescriptions = await PrescriptionRepository.findByUserId(userId);
    const now = new Date();
    return prescriptions.filter((prescription) => isExpired(prescription, now));
  },
};
