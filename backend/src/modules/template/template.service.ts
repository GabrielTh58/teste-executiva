import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TemplateRepository } from './template.repository';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateField, TemplateFieldsConfig } from './types/TemplateField.types';

@Injectable()
export class TemplateService {
  constructor(private readonly templateRepository: TemplateRepository) {}

  async create(dto: CreateTemplateDto, tenantId: string) {
    const fields: TemplateField[] = dto.fields.map((field) => ({
      key: randomUUID(),
      label: field.label,
      type: field.type,
      required: field.required,
    }));

    this.assertNoDuplicateLabels(fields);

    const fieldsConfig: TemplateFieldsConfig = { fields };

    return this.templateRepository.create(
      tenantId,
      { name: dto.name, fieldsConfig }
    );
  }

  async findAll(tenantId: string) {
    return this.templateRepository.findAllByTenant(tenantId);
  }

  async findById(id: string, tenantId: string) {
    const template = await this.templateRepository.findById(id, tenantId);
    if (!template) throw new NotFoundException('Template não encontrado');

    return template;
  }

  async update(id: string, dto: UpdateTemplateDto, tenantId: string) {
    await this.findById(id, tenantId);

    const fields: TemplateField[] | undefined = dto.fields?.map((field) => ({
      key: field.key ?? randomUUID(),
      label: field.label,
      type: field.type,
      required: field.required,
    }));

    if (fields) this.assertNoDuplicateLabels(fields);

    return this.templateRepository.update(
      id,
      {
        name: dto.name,
        fieldsConfig: fields ? { fields } : undefined,
      }
    );
  }

  async activate(id: string, tenantId: string) {
    await this.findById(id, tenantId);

    return this.templateRepository.activate(id, tenantId);
  }

  findActive(tenantId: string) {
    return this.templateRepository.findActiveByTenant(tenantId);
  }

  private assertNoDuplicateLabels(fields: TemplateField[]) {
    const labels = fields.map((field) => field.label);
    const hasDuplicate = new Set(labels).size !== labels.length;

    if (hasDuplicate) {
      throw new BadRequestException('Não podem existir campos com o mesmo nome');
    }
  }
}
