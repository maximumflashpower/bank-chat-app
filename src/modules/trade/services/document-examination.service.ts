import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentExamination } from '../entities/document-examination.entity';
import { ExaminationResult } from '../enums/examination-result.enum';

@Injectable()
export class DocumentExaminationService {
  constructor(
    @InjectRepository(DocumentExamination)
    private repo: Repository<DocumentExamination>,
  ) {}

  async submit(documentData: Partial<DocumentExamination>): Promise<DocumentExamination> {
    const doc = this.repo.create({
      ...documentData,
      examinationResult: ExaminationResult.PENDING_CORRECTION,
    });
    return this.repo.save(doc);
  }

  async findById(id: string): Promise<DocumentExamination> {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }

  async findByReference(lcOrGuaranteeRef: string): Promise<DocumentExamination[]> {
    return this.repo.find({ where: { lcOrGuaranteeRef } });
  }

  async examine(id: string, result: ExaminationResult, examinerName: string, remarks?: string): Promise<DocumentExamination> {
    const doc = await this.findById(id);
    doc.examinationResult = result;
    doc.examinerName = examinerName;
    doc.examinationDate = new Date();
    doc.remarks = remarks || '';
    if (result !== ExaminationResult.COMPLIANT) {
      doc.discrepancyCount = doc.discrepancyCount + 1;
    }
    return this.repo.save(doc);
  }

  async waiveDiscrepancy(id: string, waiverReason: string): Promise<DocumentExamination> {
    const doc = await this.findById(id);
    doc.waived = true;
    doc.waiverReason = waiverReason;
    doc.examinationResult = ExaminationResult.WAIVED;
    return this.repo.save(doc);
  }

  async getPendingDocuments(lcOrGuaranteeRef: string): Promise<DocumentExamination[]> {
    return this.repo.find({ where: { lcOrGuaranteeRef } });
  }

  async getComplianceRate(lcOrGuaranteeRef: string): Promise<number> {
    const docs = await this.findByReference(lcOrGuaranteeRef);
    const compliant = docs.filter(d => d.examinationResult === ExaminationResult.COMPLIANT).length;
    return docs.length > 0 ? (compliant / docs.length) * 100 : 0;
  }

  async markUrgent(id: string): Promise<DocumentExamination> {
    const doc = await this.findById(id);
    doc.urgentProcessing = true;
    return this.repo.save(doc);
  }

  async trackProcessingTime(docId: string): Promise<number> {
    const doc = await this.findById(docId);
    if (doc.presentationDate && doc.examinationDate) {
      const hours = (doc.examinationDate.getTime() - doc.presentationDate.getTime()) / (1000 * 60 * 60);
      doc.processingTimeHours = Math.round(hours);
      await this.repo.save(doc);
      return doc.processingTimeHours;
    }
    return 0;
  }

  async generateExaminationReport(lcOrGuaranteeRef: string): Promise<any> {
    const docs = await this.findByReference(lcOrGuaranteeRef);
    const report = {
      reference: lcOrGuaranteeRef,
      totalDocuments: docs.length,
      compliant: docs.filter(d => d.examinationResult === ExaminationResult.COMPLIANT).length,
      discrepancies: docs.filter(d => d.examinationResult !== ExaminationResult.COMPLIANT).length,
      documents: docs.map(d => ({
        documentNumber: d.documentNumber,
        result: d.examinationResult,
        discrepancyCount: d.discrepancyCount,
      })),
    };
    return report;
  }
}
