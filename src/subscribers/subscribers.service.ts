import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { FilterSubscribersDto } from './dto/filter-subscribers.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { SaveSubscriberDto } from './dto/save-subscriber.dto';

@Injectable()
export class SubscribersService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateSubscriberDto) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true
      }
    });

    if (!workspace?.id) {
      throw new NotFoundException(`Workspace ${workspaceId} does not exist`);
    }

    const exists = await this.prisma.subscriber.findUnique({
      where: { workspaceId_email: { workspaceId, email: dto.email } }
    });

    if (exists) {
      throw new ConflictException(`Subscriber with email ${dto.email} already exists in this workspace`);
    }

    const tags = dto.tags ?? [];
    
    // upsert subscriber
    const subscriber = await this.prisma.subscriber.create({
      data: {
        email: dto.email,
        name: dto.name,
        workspaceId,
        timezone: dto.timezone,
        tags: {
          connectOrCreate: tags.map(tag => ({
            where: { workspaceId_name: { workspaceId, name: tag } },
            create: { workspaceId, name: tag }
          }))
        }
      },
      include: { tags: true }
    });
    return subscriber;
  }

  async upsert(workspaceId: string, dto: SaveSubscriberDto) {
    const tags = dto.tags ?? [];

    return this.prisma.subscriber.upsert({
      where: {
        workspaceId_email: {
          workspaceId,
          email: dto.email
        }
      },
      update: {
        name: dto.name,
        tags: {
          set: [],
          connectOrCreate: tags.map(tag => ({
            where: { workspaceId_name: { workspaceId, name: tag } },
            create: { workspaceId, name: tag }
          }))
        }
      },
      create: {
        email: dto.email,
        name: dto.name,
        workspaceId,
        tags: {
          connectOrCreate: tags.map(tag => ({
            where: { workspaceId_name: { workspaceId, name: tag } },
            create: { workspaceId, name: tag }
          }))
        }
      },
      include: { tags: true }
    });
  }

  // ------------------------------
  // LIST + PAGING
  // ------------------------------
  async findAll(workspaceId: string, filter: FilterSubscribersDto) {
    const {
      page = 1,
      pageSize = 20,
      search,
      tags,
      timezones,
    } = filter;

    const where: any = { workspaceId };

    // Filter tags (multiple)
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          name: { in: tags },
        },
      };
    }

    // Filter timezone (multiple)
    if (timezones && timezones.length > 0) {
      where.timezone = { in: timezones };
    }

    // Filter search by email or name
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.subscriber.count({ where }),
      this.prisma.subscriber.findMany({
        where,
        include: { tags: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // ------------------------------
  // GET DETAIL
  // ------------------------------
  async findOne(workspaceId: string, id: string) {
    const subscriber = await this.prisma.subscriber.findFirst({
      where: { id, workspaceId },
      include: { tags: true }
    });

    if (!subscriber) throw new NotFoundException('Subscriber not found');

    return subscriber;
  }

  // ------------------------------
  // UPDATE
  // ------------------------------
  async update(workspaceId: string, id: string, dto: UpdateSubscriberDto) {
    const subscriber = await this.findOne(workspaceId, id);

    const email = dto.email ?? subscriber.email;
    const name = dto.name ?? subscriber.name;
    const timezone = dto.timezone ?? subscriber.timezone;
    const tags = dto.tags ?? subscriber.tags.map(t => t.name);

    return this.prisma.subscriber.update({
      where: { id },
      data: {
        email,
        name,
        timezone,
        tags: {
          set: [],
          connectOrCreate: tags.map(tag => ({
            where: { workspaceId_name: { workspaceId, name: tag } },
            create: { workspaceId, name: tag }
          }))
        }
      },
      include: { tags: true }
    });
  }

  // ------------------------------
  // DELETE
  // ------------------------------
  async remove(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);

    await this.prisma.subscriber.delete({
      where: { id }
    });

    return { message: 'Subscriber deleted' };
  }

  // ------------------------------
  // IMPORT CSV
  // ------------------------------
  async importCsv(workspaceId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const results: any[] = [];

    await new Promise<void>((resolve, reject) => {
      Readable.from(file.buffer)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    let success = 0;
    let failed = 0;
    const errors: {
      line: number;
      error: string;
      row?: any;
    }[] = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];

      const email = row.email?.trim();
      if (!email || !email.includes('@')) {
        failed++;
        errors.push({ line: i + 1, error: 'Invalid email', row });
        continue;
      }

      const name = row.name?.trim() || null;

      // tags: "vip;tier1" => ["vip","tier1"]
      const tags = row.tags
        ? row.tags.split(';').map((t) => t.trim())
        : [];

      try {
        await this.upsert(workspaceId, { email, name, tags });
        success++;
      } catch (e) {
        failed++;
        errors.push({ line: i + 1, error: e.message });
      }
    }

    return {
      total: results.length,
      success,
      failed,
      errors
    };
  }
}
