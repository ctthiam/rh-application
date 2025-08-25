// src/app/features/dashboard/services/dashboard.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';
import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

export interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todayTasks: number;
  myTasks?: number;
  myCompletedTasks?: number;
  myOverdueTasks?: number;
}

export interface DashboardChartData {
  tasksByStatus: { labels: string[], data: number[], colors: string[] };
  tasksByDepartment: { labels: string[], data: number[] };
  employeesByDepartment: { labels: string[], data: number[] };
  tasksThisMonth: { labels: string[], data: number[] };
}

export interface RecentActivity {
  id: string;
  type: 'task_created' | 'task_completed' | 'employee_added' | 'department_created';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export interface DashboardNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(
    private http: HttpClient,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private taskService: TaskService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  /**
   * Obtenir les statistiques du dashboard selon le rôle de l'utilisateur
   */
  getDashboardStats(): Observable<DashboardStats> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return of({
        totalEmployees: 0,
        totalDepartments: 0,
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        todayTasks: 0
      });
    }

    // Admin : toutes les statistiques
    if (this.authService.isAdmin()) {
      return this.getAdminStats();
    }
    
    // Manager : statistiques de son département
    if (this.authService.isManager()) {
      return this.getManagerStats(currentUser.id);
    }
    
    // Employé : ses propres statistiques
    return this.getEmployeeStats(currentUser.id);
  }

  /**
   * Statistiques pour l'administrateur
   */
  private getAdminStats(): Observable<DashboardStats> {
    return forkJoin({
      employees: this.employeeService.getAllEmployees(),
      departments: this.departmentService.getAllDepartments(),
      tasks: this.taskService.getAllTasks()
    }).pipe(
      map(({ employees, departments, tasks }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedTasks = tasks.filter(t => t.status === 2).length; // TERMINE = 2
        const overdueTasks = tasks.filter(t => t.isOverdue).length;
        const todayTasks = tasks.filter(t => {
          const taskDate = new Date(t.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        }).length;

        return {
          totalEmployees: employees.length,
          totalDepartments: departments.length,
          totalTasks: tasks.length,
          completedTasks,
          overdueTasks,
          todayTasks
        };
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des statistiques admin:', error);
        return of({
          totalEmployees: 0,
          totalDepartments: 0,
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          todayTasks: 0
        });
      })
    );
  }

  /**
   * Statistiques pour le manager
   */
  private getManagerStats(managerId: number): Observable<DashboardStats> {
    return forkJoin({
      departments: this.departmentService.getDepartmentsByManager(managerId),
      tasks: this.taskService.getAllTasks()
    }).pipe(
      map(({ departments, tasks }) => {
        // Filtrer les tâches du département du manager
        const departmentIds = departments.map(d => d.id);
        const departmentTasks = tasks.filter(t => 
          departmentIds.some(deptId => t.departmentName === departments.find(d => d.id === deptId)?.name)
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedTasks = departmentTasks.filter(t => t.status === 2).length;
        const overdueTasks = departmentTasks.filter(t => t.isOverdue).length;
        const todayTasks = departmentTasks.filter(t => {
          const taskDate = new Date(t.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        }).length;

        return {
          totalEmployees: 0, // À calculer avec les employés du département
          totalDepartments: departments.length,
          totalTasks: departmentTasks.length,
          completedTasks,
          overdueTasks,
          todayTasks
        };
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des statistiques manager:', error);
        return of({
          totalEmployees: 0,
          totalDepartments: 0,
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          todayTasks: 0
        });
      })
    );
  }

  /**
   * Statistiques pour l'employé
   */
  private getEmployeeStats(userId: number): Observable<DashboardStats> {
    // Trouver l'employé correspondant à l'utilisateur
    return this.employeeService.getAllEmployees().pipe(
      map(employees => employees.find(e => e.userId === userId)),
      switchMap(employee => {
        if (!employee) {
          return of({
            totalEmployees: 0,
            totalDepartments: 0,
            totalTasks: 0,
            completedTasks: 0,
            overdueTasks: 0,
            todayTasks: 0,
            myTasks: 0,
            myCompletedTasks: 0,
            myOverdueTasks: 0
          });
        }

        return this.taskService.getTasksByEmployee(employee.id).pipe(
          map(tasks => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const completedTasks = tasks.filter(t => t.status === 2).length;
            const overdueTasks = tasks.filter(t => t.isOverdue).length;
            const todayTasks = tasks.filter(t => {
              const taskDate = new Date(t.dueDate);
              taskDate.setHours(0, 0, 0, 0);
              return taskDate.getTime() === today.getTime();
            }).length;

            return {
              totalEmployees: 0,
              totalDepartments: 0,
              totalTasks: 0,
              completedTasks: 0,
              overdueTasks: 0,
              todayTasks: 0,
              myTasks: tasks.length,
              myCompletedTasks: completedTasks,
              myOverdueTasks: overdueTasks
            };
          })
        );
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des statistiques employé:', error);
        return of({
          totalEmployees: 0,
          totalDepartments: 0,
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          todayTasks: 0,
          myTasks: 0,
          myCompletedTasks: 0,
          myOverdueTasks: 0
        });
      })
    );
  }

  /**
   * Obtenir les données pour les graphiques
   */
  getChartData(): Observable<DashboardChartData> {
    return forkJoin({
      tasks: this.taskService.getAllTasks(),
      departments: this.departmentService.getAllDepartments(),
      employees: this.employeeService.getAllEmployees()
    }).pipe(
      map(({ tasks, departments, employees }) => {
        // Graphique des tâches par statut
        const tasksByStatus = {
          labels: ['En cours', 'Terminées'],
          data: [
            tasks.filter(t => t.status === 1).length, // EN_COURS = 1
            tasks.filter(t => t.status === 2).length  // TERMINE = 2
          ],
          colors: ['#ff9800', '#4caf50']
        };

        // Graphique des tâches par département
        const tasksByDept = departments.map(dept => ({
          name: dept.name,
          count: tasks.filter(t => t.departmentName === dept.name).length
        }));

        const tasksByDepartment = {
          labels: tasksByDept.map(d => d.name),
          data: tasksByDept.map(d => d.count)
        };

        // Graphique des employés par département
        const empByDept = departments.map(dept => ({
          name: dept.name,
          count: employees.filter(e => e.departmentName === dept.name).length
        }));

        const employeesByDepartment = {
          labels: empByDept.map(d => d.name),
          data: empByDept.map(d => d.count)
        };

        // Graphique des tâches créées ce mois
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const tasksThisMonth = this.getTasksForCurrentMonth(tasks, currentMonth, currentYear);

        return {
          tasksByStatus,
          tasksByDepartment,
          employeesByDepartment,
          tasksThisMonth
        };
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des données de graphiques:', error);
        return of({
          tasksByStatus: { labels: [], data: [], colors: [] },
          tasksByDepartment: { labels: [], data: [] },
          employeesByDepartment: { labels: [], data: [] },
          tasksThisMonth: { labels: [], data: [] }
        });
      })
    );
  }

  /**
   * Obtenir les tâches récentes
   */
  getRecentTasks(limit: number = 5): Observable<any[]> {
    return this.taskService.getAllTasks().pipe(
      map(tasks => {
        return tasks
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des tâches récentes:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtenir les notifications du dashboard
   */
  getNotifications(): Observable<DashboardNotification[]> {
    // Simuler des notifications (vous pouvez les récupérer depuis l'API)
    const notifications: DashboardNotification[] = [
      {
        id: '1',
        type: 'warning',
        title: 'Tâches en retard',
        message: 'Vous avez 3 tâches en retard',
        timestamp: new Date(),
        read: false,
        actionUrl: '/tasks?filter=overdue'
      },
      {
        id: '2',
        type: 'info',
        title: 'Nouveau employé',
        message: 'Un nouvel employé a été ajouté au département IT',
        timestamp: new Date(Date.now() - 3600000), // 1h ago
        read: false,
        actionUrl: '/employees'
      }
    ];

    return of(notifications);
  }

  /**
   * Marquer une notification comme lue
   */
  markNotificationAsRead(notificationId: string): Observable<boolean> {
    // Simuler l'API call
    return of(true);
  }

  /**
   * Obtenir les tâches pour le mois en cours
   */
  private getTasksForCurrentMonth(tasks: any[], month: number, year: number): { labels: string[], data: number[] } {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const labels: string[] = [];
    const data: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      labels.push(day.toString());
      
      const tasksForDay = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.toISOString().split('T')[0] === dateString;
      }).length;
      
      data.push(tasksForDay);
    }

    return { labels, data };
  }
}

// Import manquant
import { switchMap } from 'rxjs/operators';