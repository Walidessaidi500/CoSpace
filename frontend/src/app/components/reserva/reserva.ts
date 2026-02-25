import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { ReservaService } from '../../services/reserva.service';
import { StripeService } from 'ngx-stripe';
import { StripeElements, StripePaymentElementOptions } from '@stripe/stripe-js';

@Component({
  selector: 'app-reserva',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reserva.html',
  styleUrls: ['./reserva.css']
})
export class ReservaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private reservaService = inject(ReservaService);
  private cdr = inject(ChangeDetectorRef);
  private stripeService = inject(StripeService);

  espacioId: string | null = null;
  espacio: any = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Booking Form Data
  fechaInicio: string = '';
  fechaFin: string = '';

  // Calculated
  totalPrice: number = 0;
  days: number = 0;
  basePrice: number = 0; // precio base sin comisión
  commissionAmount: number = 0; // importe de la comisión
  private readonly COMMISSION_RATE = 0.1459; // 14.59%

  // Calendar UI Data
  currentMonthName: string = '';
  weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
  calendarDays: any[][] = [];

  currentDate = new Date(); // To track displayed month
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;

  // Disponibilidad
  unavailableDates: Set<string> = new Set();
  capacidad: number = 0;
  availabilityWarning: string | null = null;

  // Stripe Payment Data
  showPayment: boolean = false;
  isProcessingPayment: boolean = false;
  elements: StripeElements | undefined;
  paymentRequest: any; // Stores the Payment Request object


  ngOnInit() {
    try {
      console.log('ReservaComponent: Initializing...');
      this.generateCalendar();
      console.log('ReservaComponent: Calendar generated');

      this.route.paramMap.subscribe({
        next: (params) => {
          this.espacioId = params.get('id');
          console.log('ReservaComponent: ID received:', this.espacioId);

          if (this.espacioId) {
            this.loadEspacio(this.espacioId);
          } else {
            console.error('ReservaComponent: Invalid ID');
            this.errorMessage = 'ID de espacio no válido';
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('ReservaComponent: Route param error', err);
          this.errorMessage = 'Error al obtener parámetros de ruta';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });

      setTimeout(() => {
        if (this.isLoading) {
          console.warn('ReservaComponent: Timeout triggered');
          this.isLoading = false;
          if (!this.espacio) {
            this.errorMessage = 'La carga está tardando demasiado. Verifica tu conexión o intenta recargar.';
          }
          this.cdr.detectChanges();
        }
      }, 15000); // Increased to 15 seconds for local dev latency
    } catch (e: any) {
      console.error('ReservaComponent: Critical Init Error', e);
      this.errorMessage = 'Error de inicialización: ' + e.message;
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Set localized month name
    this.currentMonthName = this.currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    this.currentMonthName = this.currentMonthName.charAt(0).toUpperCase() + this.currentMonthName.slice(1);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate(); // 28, 29, 30, 31
    const startingDayOfWeek = firstDay.getDay(); // 0 (Sun) - 6 (Sat)

    let days: any[] = [];

    // Empty slots for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Chunk into weeks
    this.calendarDays = [];
    while (days.length > 0) {
      this.calendarDays.push(days.splice(0, 7));
    }
  }

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendar();
    if (this.espacioId) this.loadDisponibilidad(this.espacioId);
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendar();
    if (this.espacioId) this.loadDisponibilidad(this.espacioId);
  }

  selectDate(date: Date) {
    if (!date) return;
    if (this.isDateUnavailable(date)) return; // No permitir seleccionar días ocupados

    // Reset if both selected or if clicking before start
    if (this.selectedStartDate && this.selectedEndDate) {
      this.selectedStartDate = date;
      this.selectedEndDate = null;
    } else if (!this.selectedStartDate) {
      this.selectedStartDate = date;
    } else {
      // If clicking before start, make it new start
      if (date < this.selectedStartDate) {
        this.selectedStartDate = date;
        this.selectedEndDate = null;
      } else {
        this.selectedEndDate = date;
      }
    }

    this.updateFormAndPrice();
  }

  updateFormAndPrice() {
    if (this.selectedStartDate) {
      // Format for input datetime-local: YYYY-MM-DDTHH:mm
      // We use 00:00 for valid simple date comparison
      const y = this.selectedStartDate.getFullYear();
      const m = String(this.selectedStartDate.getMonth() + 1).padStart(2, '0');
      const d = String(this.selectedStartDate.getDate()).padStart(2, '0');
      this.fechaInicio = `${y}-${m}-${d}T09:00`; // Default 9 AM
    }

    if (this.selectedEndDate) {
      const y = this.selectedEndDate.getFullYear();
      const m = String(this.selectedEndDate.getMonth() + 1).padStart(2, '0');
      const d = String(this.selectedEndDate.getDate()).padStart(2, '0');
      this.fechaFin = `${y}-${m}-${d}T18:00`; // Default 6 PM

      this.calculatePrice();
    } else {
      this.fechaFin = '';
      this.totalPrice = 0;
      this.days = 0;
    }

    // Hide payment if dates change
    this.showPayment = false;
    this.cdr.detectChanges();
  }

  // Also handle manual input changes
  onDateChange() {
    if (this.fechaInicio) this.selectedStartDate = new Date(this.fechaInicio);
    if (this.fechaFin) this.selectedEndDate = new Date(this.fechaFin);
    this.calculatePrice();
    this.showPayment = false;
  }

  calculatePrice() {
    if (this.selectedStartDate && this.selectedEndDate && this.espacio) {
      const diffTime = Math.abs(this.selectedEndDate.getTime() - this.selectedStartDate.getTime());
      // Round up to ensure at least 1 day or capture partials as 1
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.days = diffDays > 0 ? diffDays : 1;

      this.basePrice = this.days * this.espacio.precio_hora;
      this.commissionAmount = this.basePrice * this.COMMISSION_RATE;
      this.totalPrice = this.basePrice + this.commissionAmount;
    }
  }

  isDateSelected(date: Date): boolean {
    if (!date || !this.selectedStartDate) return false;

    const isStart = this.isSameDay(date, this.selectedStartDate);
    const isEnd = this.selectedEndDate ? this.isSameDay(date, this.selectedEndDate) : false;

    return isStart || isEnd;
  }

  isDateInRange(date: Date): boolean {
    if (!date || !this.selectedStartDate || !this.selectedEndDate) return false;

    // Normalize to 00:00:00 for range comparison
    const d = new Date(date).setHours(0, 0, 0, 0);
    const start = new Date(this.selectedStartDate).setHours(0, 0, 0, 0);
    const end = new Date(this.selectedEndDate).setHours(0, 0, 0, 0);

    return d > start && d < end;
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  loadEspacio(id: string) {
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges();

    this.apiService.getEspacioById(id).subscribe({
      next: (data: any) => {
        console.log('API Response:', data);
        if (data) {
          this.espacio = data;
          this.capacidad = data.capacidad || 1;
          // Cargar disponibilidad del mes actual
          this.loadDisponibilidad(id);
        } else {
          this.errorMessage = 'No se encontraron datos para este espacio';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API Error:', err);
        this.errorMessage = 'Error al cargar el espacio. ' + (err.message || '');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Carga los días no disponibles del mes visible del calendario
   */
  loadDisponibilidad(id: string) {
    const year = this.currentDate.getFullYear();
    const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
    const mes = `${year}-${month}`;

    this.apiService.get(`/espacios/${id}/disponibilidad?mes=${mes}`).subscribe({
      next: (data: any) => {
        this.unavailableDates = new Set(data.dias_ocupados || []);
        this.capacidad = data.capacidad || 1;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando disponibilidad:', err);
      }
    });
  }

  /**
   * Comprobar si un día está lleno
   */
  isDateUnavailable(date: Date): boolean {
    if (!date) return false;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return this.unavailableDates.has(dateStr);
  }

  /**
   * Comprobar si un día es pasado
   */
  isDatePast(date: Date): boolean {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  }

  iniciarProcesoReserva() {
    if (!this.espacioId || !this.fechaInicio || !this.fechaFin) {
      alert('Por favor selecciona las fechas en el calendario');
      return;
    }

    const payload = {
      id_espacio: this.espacioId,
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin
    };

    // Call backend to create pending reservation and get Stripe Client Secret
    this.isLoading = true; // Show loading to indicate processing
    this.cdr.detectChanges();
    this.reservaService.initiatePayment(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        console.log('Reserva creada (pendiente), iniciando pago', res);

        if (res.clientSecret) {
          this.showPayment = true;
          this.cdr.detectChanges();

          // 1. Setup Payment Request (Apple Pay / Google Pay)
          const amount = Math.round(res.details.monto_total * 100);
          const prOptions = {
            country: 'ES',
            currency: 'eur',
            total: {
              label: 'Reserva Total',
              amount: amount
            },
            requestPayerName: true,
            requestPayerEmail: true
          };

          const pr = this.stripeService.paymentRequest(prOptions);
          this.paymentRequest = pr;

          // Check availability (Apple Pay needs HTTPS/valid domain, Google Pay needs HTTPS/localhost)
          pr.canMakePayment().then((result: any) => {
            const walletAvailable = !!result;

            if (walletAvailable) {
              // Handle Wallet Payment
              pr.on('paymentmethod', (ev: any) => {
                this.stripeService.confirmCardPayment(res.clientSecret, {
                  payment_method: ev.paymentMethod.id
                }).subscribe(confirmResult => {
                  if (confirmResult.error) {
                    ev.complete('fail');
                    alert('Error en pago con Wallet: ' + confirmResult.error.message);
                  } else {
                    ev.complete('success');
                    if (confirmResult.paymentIntent && confirmResult.paymentIntent.status === 'succeeded') {
                      this.finalizarReservaEnBD(confirmResult.paymentIntent.id);
                    }
                  }
                });
              });
            }

            // 2. Initialize Standard Elements (Always)
            this.stripeService.elements({
              clientSecret: res.clientSecret,
              appearance: { theme: 'stripe' },
              locale: 'es'
            }).subscribe(elements => {
              this.elements = elements;

              // Mount Standard Payment Element
              const paymentElement = this.elements.create('payment', {
                layout: 'tabs'
              });
              paymentElement.mount('#payment-element');

              // Mount Wallet Button if available
              if (walletAvailable) {
                const prButton = this.elements.create('paymentRequestButton', {
                  paymentRequest: pr
                });
                prButton.mount('#payment-request-button');
              }
            });
          });

        } else {
          // Fallback if free
          alert('Reserva gratuita detectada.');
        }
      },
      error: (err) => {
        console.error('Error detallado:', err);
        this.isLoading = false;

        // Error 409: Conflicto de disponibilidad
        if (err.status === 409 && err.error?.message) {
          this.availabilityWarning = err.error.message;
          // Recargar disponibilidad para actualizar el calendario
          if (this.espacioId) this.loadDisponibilidad(this.espacioId);
        } else {
          let errorDetails = '';
          if (err.error && typeof err.error === 'object') {
            errorDetails = err.error.message || JSON.stringify(err.error, null, 2);
          } else {
            errorDetails = JSON.stringify(err, null, 2);
          }
          alert('Error al iniciar pago: ' + errorDetails);
        }

        this.cdr.detectChanges();
      }
    });
  }

  // Step 2: Confirm Payment with Stripe
  realizarPago() {
    if (this.isProcessingPayment || !this.elements) return;
    this.isProcessingPayment = true;

    this.stripeService.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: window.location.origin,
        payment_method_data: {}
      },
      redirect: 'if_required'
    }).subscribe({
      next: (result) => {
        if (result.error) {
          this.isProcessingPayment = false;
          console.error('Error pago:', result.error);
          alert('Error en el pago: ' + result.error.message);
        } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
          // Step 3: Payment Succeeded, NOW save to DB
          this.finalizarReservaEnBD(result.paymentIntent.id);
        }
      },
      error: (err) => {
        this.isProcessingPayment = false;
        console.error('Error sistema pago:', err);
        alert('Error al procesar el pago');
      }
    });
  }

  // Step 3: Save Reservation to Backend
  finalizarReservaEnBD(paymentIntentId: string) {
    const payload = {
      payment_intent_id: paymentIntentId,
      id_espacio: this.espacioId,
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin
    };

    // We can show a 'Finalizing...' spinner or keep the payment button loading
    // this.isLoading = true; // Use global loading or keep local

    this.reservaService.crearReserva(payload).subscribe({
      next: (res) => {
        this.isProcessingPayment = false;
        alert('¡Pago exitoso y Reserva confirmada!');
        this.router.navigate(['/cliente/panel']);
      },
      error: (err) => {
        this.isProcessingPayment = false;
        console.error('Error al guardar reserva post-pago:', err);

        let detailedMsg = 'Pago realizado pero hubo un error al guardar la reserva.';
        if (err.error && err.error.message) {
          detailedMsg += '\nCausa: ' + err.error.message;
        }
        if (err.error && err.error.debug) {
          detailedMsg += '\nDetalle: ' + err.error.debug;
        }

        alert(detailedMsg + '\n\nID de pago (Stripe): ' + paymentIntentId);
      }
    });
  }
}
