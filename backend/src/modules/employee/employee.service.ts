import type { Employee, EmployeeStatus } from "@prisma/client";

import {
  employeeRepository,
  type EmployeeSortBy,
  type EmployeeSortOrder,
} from "./employee.repository";

type GetEmployeesQuery = {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: EmployeeStatus;
  sortBy?: EmployeeSortBy;
  sortOrder?: EmployeeSortOrder;
};

type GetEmployeesMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type GetEmployeesResult = {
  data: Employee[];
  meta: GetEmployeesMeta;
};

type EmployeeDetail = Pick<
  Employee,
  | "id"
  | "employeeCode"
  | "fullName"
  | "email"
  | "phone"
  | "position"
  | "status"
  | "joinedAt"
  | "createdAt"
  | "updatedAt"
>;

export class EmployeeServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "EmployeeServiceError";
  }
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parsePositiveInteger = (
  value: number | string | undefined,
  defaultValue: number,
): number => {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue)) {
    return Number.NaN;
  }

  return parsedValue;
};

const normalizePagination = (
  pageInput: number | string | undefined,
  limitInput: number | string | undefined,
): { page: number; limit: number; skip: number; take: number } => {
  const page = parsePositiveInteger(pageInput, DEFAULT_PAGE);
  const limit = parsePositiveInteger(limitInput, DEFAULT_LIMIT);

  if (page < 1 || Number.isNaN(page)) {
    throw new EmployeeServiceError("Invalid page", 400);
  }

  if (limit < 1 || limit > MAX_LIMIT || Number.isNaN(limit)) {
    throw new EmployeeServiceError("Invalid limit", 400);
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
};

export const employeeService = {
  async getEmployees(query: GetEmployeesQuery): Promise<GetEmployeesResult> {
    const { page, limit, skip, take } = normalizePagination(
      query.page,
      query.limit,
    );

    const repositoryParams = {
      skip,
      take,
      search: query.search,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const [employees, totalItems] = await Promise.all([
      employeeRepository.findEmployees(repositoryParams),
      employeeRepository.countEmployees(repositoryParams),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: employees,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    };
  },

  async getEmployeeById(id: string): Promise<EmployeeDetail> {
    if (!UUID_REGEX.test(id)) {
      throw new EmployeeServiceError("Employee not found", 404);
    }

    const employee = await employeeRepository.findEmployeeById(id);

    if (!employee) {
      throw new EmployeeServiceError("Employee not found", 404);
    }

    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      status: employee.status,
      joinedAt: employee.joinedAt,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  },
};
