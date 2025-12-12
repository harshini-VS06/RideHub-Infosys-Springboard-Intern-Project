package com.ridehub.service;

import com.ridehub.dto.NotificationMessage;
import com.ridehub.model.Booking;
import com.ridehub.model.Payment;
import com.ridehub.model.Ride;
import com.ridehub.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    public void sendPaymentSuccessNotification(User passenger, Booking booking, Payment payment) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("paymentId", payment.getId());
        data.put("amount", payment.getAmount());
        data.put("razorpayPaymentId", payment.getRazorpayPaymentId());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("PAYMENT_SUCCESS")
                .title("Payment Successful")
                .message(String.format("Your payment of ₹%.2f for booking #%d has been completed successfully.", 
                        payment.getAmount(), booking.getId()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendDriverPaymentNotification(User driver, Booking booking, Payment payment) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("paymentId", payment.getId());
        data.put("amount", payment.getAmount());
        data.put("passengerName", booking.getPassenger().getName());
        data.put("razorpayOrderId", payment.getRazorpayOrderId());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("PAYMENT_RECEIVED")
                .title("Payment Received")
                .message(String.format("Payment of ₹%.2f received from %s for booking #%d. Amount has been credited to your wallet (locked until ride completion).", 
                        payment.getAmount(), booking.getPassenger().getName(), booking.getId()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                driver.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendBookingConfirmationNotification(User passenger, Booking booking) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("rideId", booking.getRide().getId());
        data.put("maximumPrice", booking.getMaximumPrice());
        data.put("totalTripCost", booking.getTotalTripCost());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("BOOKING_TENTATIVE")
                .title("Booking Created (Tentative)")
                .message(String.format("Your booking #%d has been created. Maximum price: ₹%.2f. Payment will be required 24 hours before the ride.", 
                        booking.getId(), booking.getMaximumPrice()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendPaymentRequestNotification(User passenger, Booking booking) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("finalPrice", booking.getFinalPrice());
        data.put("paymentDueAt", booking.getPaymentDueAt().format(formatter));
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("PAYMENT_REQUEST")
                .title("Payment Required")
                .message(String.format("Your ride is in 24 hours! Please complete payment of ₹%.2f for booking #%d to confirm your seat.", 
                        booking.getFinalPrice(), booking.getId()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendFundsUnlockedNotification(User driver, Booking booking, Double amount) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("amount", amount);
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("FUNDS_UNLOCKED")
                .title("Funds Available")
                .message(String.format("₹%.2f has been unlocked and is now available for withdrawal in your wallet after ride completion.", 
                        amount))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                driver.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendRideCancellationNotification(User passenger, Booking booking, String reason) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("rideId", booking.getRide().getId());
        data.put("reason", reason);
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("RIDE_CANCELLED")
                .title("Ride Cancelled")
                .message(String.format("Your ride #%d has been cancelled by the driver. Reason: %s. Full refund will be processed.", 
                        booking.getRide().getId(), reason))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendRefundNotification(User passenger, Booking booking, Double amount, String reason) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("amount", amount);
        data.put("reason", reason);
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("REFUND_INITIATED")
                .title("Refund Initiated")
                .message(String.format("Full refund of ₹%.2f has been initiated for booking #%d. Amount will be credited to your account within 5-7 business days.", 
                        amount, booking.getId()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendRefundFailureNotification(User passenger, Booking booking) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("REFUND_FAILED")
                .title("Refund Processing Issue")
                .message(String.format("There was an issue processing your refund for booking #%d. Our support team will contact you shortly.", 
                        booking.getId()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendRideStartWarning(User user, Booking booking, String userType) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("rideId", booking.getRide().getId());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("RIDE_START_WARNING")
                .title("Ride Starting Soon - Action Required")
                .message(String.format(
                    "Your ride #%d is starting in 1 hour. If you need to cancel, please do so now to receive a refund. " +
                    "If the ride is not initiated, no refund will be issued and you will receive one strike.",
                    booking.getRide().getId()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendPassengerOnboardedNotification(User passenger, Booking booking) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("rideId", booking.getRide().getId());
        data.put("sosEnabled", true);
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("PASSENGER_ONBOARDED")
                .title("Have a Safe Journey!")
                .message("You have been successfully onboarded. Have a safe journey! In case of emergency, use the SOS button.")
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendDriverCancellationNotificationToPassengers(List<User> passengers, Booking booking, String reason) {
        for (User passenger : passengers) {
            Map<String, Object> data = new HashMap<>();
            data.put("bookingId", booking.getId());
            data.put("rideId", booking.getRide().getId());
            data.put("reason", reason);
            data.put("refundStatus", "INITIATED");
            
            NotificationMessage notification = NotificationMessage.builder()
                    .type("DRIVER_CANCELLED_RIDE")
                    .title("Ride Cancelled by Driver")
                    .message(String.format(
                        "The driver has cancelled your ride #%d. Reason: %s. " +
                        "A 100%% refund has been initiated and will be credited to your account within 5-7 business days.",
                        booking.getRide().getId(), reason))
                    .data(data)
                    .timestamp(LocalDateTime.now().format(formatter))
                    .build();
            
            messagingTemplate.convertAndSendToUser(
                    passenger.getEmail(),
                    "/queue/notifications",
                    notification
            );
        }
    }
    
    public void sendOneHourWarningToAll(User driver, List<User> passengers, Booking booking) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("rideId", booking.getRide().getId());
        data.put("warningType", "ONE_HOUR_WARNING");
        
        // Send to driver
        NotificationMessage driverNotification = NotificationMessage.builder()
                .type("RIDE_START_WARNING")
                .title("Ride Starting in 1 Hour - Action Required")
                .message(String.format(
                    "Your ride #%d is starting in 1 hour. If you need to cancel, please do so now. " +
                    "Otherwise, please initiate the ride on time. If the ride is not initiated, " +
                    "you will receive one strike and passengers will not receive refunds.",
                    booking.getRide().getId()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                driver.getEmail(),
                "/queue/notifications",
                driverNotification
        );
        
        // Send to all passengers
        for (User passenger : passengers) {
            NotificationMessage passengerNotification = NotificationMessage.builder()
                    .type("RIDE_START_WARNING")
                    .title("Ride Starting in 1 Hour - Action Required")
                    .message(String.format(
                        "Your ride #%d is starting in 1 hour. If you need to cancel, please do so now to receive a refund. " +
                        "If the ride is not initiated by the driver, no refund will be issued and you will receive one strike.",
                        booking.getRide().getId()))
                    .data(data)
                    .timestamp(LocalDateTime.now().format(formatter))
                    .build();
            
            messagingTemplate.convertAndSendToUser(
                    passenger.getEmail(),
                    "/queue/notifications",
                    passengerNotification
            );
        }
    }
    
    public void sendTripStartedNotification(User passenger, Ride ride) {
        Map<String, Object> data = new HashMap<>();
        data.put("rideId", ride.getId());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("TRIP_STARTED")
                .title("Your Ride Has Started")
                .message(String.format(
                    "The driver has started the trip. They are on the way to pick you up from %s.",
                    ride.getSource()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendOnboardedNotification(User passenger, Ride ride) {
        Map<String, Object> data = new HashMap<>();
        data.put("rideId", ride.getId());
        data.put("sosEnabled", true);
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("PASSENGER_ONBOARDED")
                .title("Have a Safe Journey!")
                .message("You have been successfully onboarded. Have a safe journey!")
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendDeboardedNotification(User passenger, Ride ride) {
        Map<String, Object> data = new HashMap<>();
        data.put("rideId", ride.getId());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("PASSENGER_DEBOARDED")
                .title("Trip Completed")
                .message("You have been successfully deboarded. Thank you for riding with RideHub!")
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendAllPassengersOnboardedNotification(User driver, Ride ride) {
        Map<String, Object> data = new HashMap<>();
        data.put("rideId", ride.getId());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("ALL_PASSENGERS_ONBOARDED")
                .title("All Passengers Onboarded")
                .message("All passengers have been picked up. You can now proceed to destinations.")
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                driver.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendCancellationConfirmation(User passenger, Booking booking, Object refundCalculation) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("rideId", booking.getRide().getId());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("CANCELLATION_CONFIRMED")
                .title("Booking Cancelled")
                .message(String.format(
                    "Your booking #%d has been cancelled successfully. Refund will be processed according to our policy.",
                    booking.getId()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendPassengerCancelledNotification(User driver, Booking booking, User passenger) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("passengerName", passenger.getName());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("PASSENGER_CANCELLED")
                .title("Passenger Cancelled Booking")
                .message(String.format(
                    "%s has cancelled their booking for your ride. The seat is now available.",
                    passenger.getName()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                driver.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendDriverCancelledNotification(User passenger, Booking booking, Ride ride) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("rideId", ride.getId());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("DRIVER_CANCELLED_RIDE")
                .title("Ride Cancelled by Driver")
                .message("The driver has cancelled the ride. A full refund will be processed automatically.")
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                passenger.getEmail(),
                "/queue/notifications",
                notification
        );
    }
    
    public void sendBookingCancellationNotification(User driver, Booking booking) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", booking.getId());
        data.put("passengerName", booking.getPassenger().getName());
        data.put("seatsBooked", booking.getSeatsBooked());
        
        NotificationMessage notification = NotificationMessage.builder()
                .type("BOOKING_CANCELLED")
                .title("Booking Cancelled")
                .message(String.format(
                    "%s has cancelled their booking for %d seat(s). The seat(s) are now available.",
                    booking.getPassenger().getName(), booking.getSeatsBooked()))
                .data(data)
                .timestamp(LocalDateTime.now().format(formatter))
                .build();
        
        messagingTemplate.convertAndSendToUser(
                driver.getEmail(),
                "/queue/notifications",
                notification
        );
    }
}
