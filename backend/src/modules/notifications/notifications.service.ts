import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    actorId?: string,
  ): Promise<Notification> {
    const notification = this.repo.create({
      userId,
      type,
      title,
      message,
      metadata,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(notification);
  }

  async findAll(userId: string): Promise<{ data: Notification[]; unreadCount: number }> {
    const [data, unreadCount] = await Promise.all([
      this.repo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.repo.count({ where: { userId, isRead: false } }),
    ]);
    return { data, unreadCount };
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.repo.update({ id, userId }, { isRead: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }
}
