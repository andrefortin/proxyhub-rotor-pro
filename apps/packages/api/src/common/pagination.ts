import { BadRequestException } from '@nestjs/common';

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  skip?: number; // Optional, include if directly set
}

export function validatePagination(params?: PaginationParams): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, params?.page || 1);
  let limit = Math.min(100, Math.max(1, params?.limit || 10));
  let skip: number;

  if (params?.skip !== undefined) {
    skip = Math.max(0, params.skip);
    // Recompute page from skip and limit for consistency in response
    page = Math.floor(skip / limit) + 1;
  } else {
    skip = (page - 1) * limit;
  }

  const take = limit;

  return { skip, take, page, limit };
}