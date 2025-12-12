package com.ridehub.service;

import com.ridehub.model.Booking;
import com.ridehub.model.Payment;
import com.ridehub.model.Ride;
import com.ridehub.model.User;
import com.ridehub.repository.BookingRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final BookingRepository bookingRepository;
    
    public void sendOTPEmail(String email, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(email);
            message.setSubject("RideHub - Your Verification Code");
            
            String emailBody = String.format(
                "Dear User,\n\n" +
                "Thank you for choosing RideHub!\n\n" +
                "Your One-Time Password (OTP) for verification is:\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "        %s\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "This OTP is valid for 10 minutes.\n\n" +
                "If you did not request this code, please ignore this email.\n\n" +
                "For security reasons, do not share this OTP with anyone.\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                otpCode
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
            throw new RuntimeException("Failed to send OTP email");
        }
    }
    
    public void sendRideCreationEmail(User driver, Ride ride) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(driver.getEmail());
            message.setSubject("RideHub - Ride Created Successfully");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "Your ride has been successfully created on RideHub!\n\n" +
                "Ride Details:\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Time: %s\n" +
                "Available Seats: %d\n" +
                "Fare: ₹%.2f per km\n" +
                "Distance: %.2f km\n" +
                "Vehicle: %s (%s)\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Passengers can now book seats on your ride. You will receive notifications " +
                "when bookings are made.\n\n" +
                "Thank you for using RideHub!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                driver.getName(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                ride.getTotalSeats(),
                ride.getFarePerKm(),
                ride.getDistance() != null ? ride.getDistance() : 0.0,
                driver.getCarModel(),
                driver.getLicensePlate()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            // Log error but don't fail the transaction
            System.err.println("Failed to send ride creation email: " + e.getMessage());
        }
    }
    
    public void sendBookingConfirmationEmail(User passenger, User driver, Booking booking, Ride ride) {
        // Send email to passenger
        sendPassengerBookingEmail(passenger, driver, booking, ride);
        
        // Send email to driver
        sendDriverBookingNotification(driver, passenger, booking, ride);
    }
    
    private void sendPassengerBookingEmail(User passenger, User driver, Booking booking, Ride ride) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Booking Confirmed!");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "Your ride booking has been confirmed! 🎉\n\n" +
                "Booking Details:\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "Booking ID: #%d\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Time: %s\n\n" +
                "Your Journey:\n" +
                "Pickup: %s\n" +
                "Drop: %s\n" +
                "Seats Booked: %d\n" +
                "Distance: %.2f km\n" +
                "Total Fare: ₹%.2f\n\n" +
                "Driver Details:\n" +
                "Name: %s\n" +
                "Contact: %s\n" +
                "Vehicle: %s (%s)\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Please reach the pickup location on time. For any queries, contact your driver.\n\n" +
                "Have a safe journey!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                booking.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                booking.getPickupLocation(),
                booking.getDropLocation(),
                booking.getSeatsBooked(),
                booking.getSegmentDistance() != null ? booking.getSegmentDistance() : 0.0,
                booking.getFinalPrice() != null ? booking.getFinalPrice() : booking.getMaximumPrice(),
                driver.getName(),
                driver.getContact(),
                driver.getCarModel(),
                driver.getLicensePlate()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send passenger booking email: " + e.getMessage());
        }
    }
    
    public void sendDriverBookingNotification(User driver, User passenger, Booking booking, Ride ride) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(driver.getEmail());
            message.setSubject("RideHub - New Booking Received!");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "Great news! You have received a new booking for your ride! 🚗\n\n" +
                "Ride Details:\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Time: %s\n\n" +
                "Passenger Details:\n" +
                "Name: %s\n" +
                "Contact: %s\n" +
                "Pickup Location: %s\n" +
                "Drop Location: %s\n" +
                "Seats Booked: %d\n" +
                "Fare Amount: ₹%.2f\n\n" +
                "Available Seats Remaining: %d\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Please coordinate with the passenger for pickup. You can view all your bookings " +
                "in your driver dashboard.\n\n" +
                "Thank you for being a valued driver on RideHub!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                driver.getName(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                passenger.getName(),
                passenger.getContact(),
                booking.getPickupLocation(),
                booking.getDropLocation(),
                booking.getSeatsBooked(),
                booking.getFinalPrice() != null ? booking.getFinalPrice() : booking.getMaximumPrice(),
                ride.getAvailableSeats()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send driver booking notification: " + e.getMessage());
        }
    }
    
    public void sendInitialBookingEmail(User passenger, Booking booking, Ride ride) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Booking Created (Tentative) - Important Payment Information");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "Your booking has been successfully created! 🎉\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "BOOKING STATUS: TENTATIVE (Payment Pending)\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Ride Details:\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Time: %s\n" +
                "Seats Booked: %d\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "IMPORTANT: PRICE SHARING EXPLAINED\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Total Trip Cost: ₹%.2f\n" +
                "Maximum Price (if you're the only passenger): ₹%.2f\n\n" +
                "HOW PRICING WORKS:\n\n" +
                "1. The price shown above (₹%.2f) is the MAXIMUM you would pay if you were " +
                "the only passenger on this ride.\n\n" +
                "2. The actual price you'll pay will be LOWER because the Total Trip Cost (₹%.2f) " +
                "is divided equally among ALL confirmed passengers.\n\n" +
                "3. The more passengers who book and pay, the less each person pays!\n\n" +
                "Formula: Your Final Price = Total Trip Cost ÷ Total Confirmed Passengers\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "PAYMENT TIMELINE\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Your booking is currently TENTATIVE.\n\n" +
                "⏰ 24 HOURS BEFORE THE RIDE:\n" +
                "   • We will calculate your FINAL PRICE based on all confirmed passengers\n" +
                "   • You will receive a payment link via email\n" +
                "   • You MUST complete the payment to confirm your seat\n\n" +
                "⚠️ If payment is not completed, your booking will be automatically cancelled.\n\n" +
                "Payment Due Date: %s at %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "WHAT HAPPENS NEXT?\n\n" +
                "1. Your seat is reserved (tentative) until 24 hours before the ride\n" +
                "2. We'll monitor all bookings on this ride\n" +
                "3. Exactly 24 hours before departure, we'll send you:\n" +
                "   - Your exact final price\n" +
                "   - A secure payment link\n" +
                "   - The number of passengers sharing the cost\n" +
                "4. Complete the payment to confirm your booking\n" +
                "5. Your seat becomes CONFIRMED after successful payment\n\n" +
                "You can track your booking status anytime in your RideHub dashboard.\n\n" +
                "Have questions? Reply to this email or contact support.\n\n" +
                "Best regards,\n" +
                "The RideHub Team\n\n" +
                "P.S. Remember: The final price will likely be LOWER than the maximum shown above!",
                passenger.getName(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                booking.getSeatsBooked(),
                booking.getTotalTripCost(),
                booking.getMaximumPrice(),
                booking.getMaximumPrice(),
                booking.getTotalTripCost(),
                booking.getPaymentDueAt().toLocalDate().format(dateFormatter),
                booking.getPaymentDueAt().toLocalTime().format(timeFormatter)
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send initial booking email: " + e.getMessage());
        }
    }
    
    public void sendPaymentRequestEmail(User passenger, Booking booking, double finalSeatRate, int totalBookedSeats) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - PAYMENT REQUIRED: Your Ride is in 24 Hours!");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            Ride ride = booking.getRide();
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "⏰ Your ride is in 24 HOURS! Payment is now required to confirm your seat.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "PAYMENT DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Booking ID: #%d\n" +
                "Ride Date: %s\n" +
                "Ride Time: %s\n" +
                "From: %s\n" +
                "To: %s\n\n" +
                "Total Passengers Sharing Cost: %d\n" +
                "Total Trip Cost: ₹%.2f\n" +
                "Per Seat Rate: ₹%.2f\n" +
                "Your Seats: %d\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "YOUR FINAL AMOUNT DUE: ₹%.2f\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "This is your FINAL PRICE - much better than the maximum of ₹%.2f!\n\n" +
                "⚠️ IMPORTANT:\n" +
                "• Payment must be completed to confirm your booking\n" +
                "• If not paid, your booking will be automatically cancelled\n" +
                "• Once cancelled, your seat may be taken by other passengers\n\n" +
                "HOW TO PAY:\n" +
                "1. Log in to your RideHub account\n" +
                "2. Go to \"My Bookings\"\n" +
                "3. Find booking #%d\n" +
                "4. Click \"Pay Now\" button\n" +
                "5. Complete payment using Razorpay (secure payment gateway)\n\n" +
                "After successful payment:\n" +
                "✓ Your booking status will change to CONFIRMED\n" +
                "✓ You'll receive a confirmation email\n" +
                "✓ The driver will be notified\n" +
                "✓ Payment will be credited to driver's wallet\n\n" +
                "Payment Methods Accepted:\n" +
                "• Credit/Debit Cards\n" +
                "• UPI\n" +
                "• Net Banking\n" +
                "• Wallets\n\n" +
                "Need Help? Contact us immediately at support@ridehub.com\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                booking.getId(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                ride.getSource(),
                ride.getDestination(),
                totalBookedSeats,
                booking.getTotalTripCost(),
                finalSeatRate,
                booking.getSeatsBooked(),
                booking.getFinalPrice(),
                booking.getMaximumPrice(),
                booking.getId()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send payment request email: " + e.getMessage());
        }
    }
    
    public void sendPaymentConfirmationEmail(User passenger, Booking booking, Payment payment) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Payment Successful! Booking Confirmed");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a");
            Ride ride = booking.getRide();
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "✅ Payment Successful! Your booking is now CONFIRMED! 🎉\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "PAYMENT CONFIRMATION\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Payment ID: %s\n" +
                "Booking ID: #%d\n" +
                "Amount Paid: ₹%.2f\n" +
                "Payment Date: %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "RIDE DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Time: %s\n" +
                "Seats Confirmed: %d\n\n" +
                "Pickup: %s\n" +
                "Drop: %s\n\n" +
                "Driver: %s\n" +
                "Contact: %s\n" +
                "Vehicle: %s (%s)\n\n" +
                "Your seat is now secured! Please be at the pickup location on time.\n\n" +
                "Have a safe journey!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                payment.getRazorpayPaymentId(),
                booking.getId(),
                payment.getAmount(),
                payment.getPaidAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a")),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                booking.getSeatsBooked(),
                booking.getPickupLocation(),
                booking.getDropLocation(),
                ride.getDriver().getName(),
                ride.getDriver().getContact(),
                ride.getDriver().getCarModel(),
                ride.getDriver().getLicensePlate()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send payment confirmation email: " + e.getMessage());
        }
    }
    
    public void sendDriverPaymentReceivedEmail(User driver, Booking booking, Payment payment) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(driver.getEmail());
            message.setSubject("RideHub - Payment Received & Credited to Your Wallet");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            Ride ride = booking.getRide();
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "Great news! Payment received for your ride! 💰\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "PAYMENT DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Razorpay Order ID: %s\n" +
                "Booking ID: #%d\n" +
                "Amount: ₹%.2f\n" +
                "Status: CREDITED TO WALLET (LOCKED)\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "PASSENGER DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Name: %s\n" +
                "Contact: %s\n" +
                "Seats: %d\n" +
                "Pickup: %s\n" +
                "Drop: %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "RIDE DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Time: %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "WALLET INFORMATION\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "✓ The amount of ₹%.2f has been credited to your HubWallet\n" +
                "⚠️ Funds are currently LOCKED and non-encashable\n" +
                "✓ Funds will be unlocked after ride completion\n" +
                "✓ Once unlocked, you can withdraw to your bank account\n\n" +
                "This system ensures passenger satisfaction and protects both parties.\n\n" +
                "View your wallet balance in the Driver Dashboard.\n\n" +
                "Thank you for being a valued RideHub driver!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                driver.getName(),
                payment.getRazorpayOrderId(),
                booking.getId(),
                payment.getAmount(),
                booking.getPassenger().getName(),
                booking.getPassenger().getContact(),
                booking.getSeatsBooked(),
                booking.getPickupLocation(),
                booking.getDropLocation(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                payment.getAmount()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send driver payment received email: " + e.getMessage());
        }
    }
    
    public void sendDriverCancellationEmailToPassengers(List<User> passengers, Ride ride, String reason) {
        for (User passenger : passengers) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("noreply@ridehub.com");
                message.setTo(passenger.getEmail());
                message.setSubject("RideHub - URGENT: Ride Cancelled by Driver - Full Refund Initiated");
                
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
                DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
                
                String emailBody = String.format(
                    "Dear %s,\n\n" +
                    "We regret to inform you that your ride has been cancelled by the driver.\n\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                    "RIDE DETAILS\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                    "Ride ID: #%d\n" +
                    "From: %s\n" +
                    "To: %s\n" +
                    "Date: %s\n" +
                    "Time: %s\n" +
                    "Cancellation Reason: %s\n\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                    "REFUND INFORMATION\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                    "✅ A 100%% FULL REFUND has been initiated automatically\n" +
                    "✅ The refund will be credited to your original payment method\n" +
                    "✅ Processing time: 5-7 business days\n\n" +
                    "You will receive a confirmation email once the refund is processed by Razorpay.\n\n" +
                    "We apologize for any inconvenience caused. You can search for alternative " +
                    "rides on RideHub at any time.\n\n" +
                    "If you have any questions or concerns, please contact our support team.\n\n" +
                    "Best regards,\n" +
                    "The RideHub Team",
                    passenger.getName(),
                    ride.getId(),
                    ride.getSource(),
                    ride.getDestination(),
                    ride.getRideDate().format(dateFormatter),
                    ride.getRideTime().format(timeFormatter),
                    reason
                );
                
                message.setText(emailBody);
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Failed to send driver cancellation email to passenger: " + e.getMessage());
            }
        }
    }
    
    public void sendOneHourWarningEmail(User user, Ride ride, String userType) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(user.getEmail());
            message.setSubject("RideHub - URGENT: Ride Starting in 1 Hour - Action Required!");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody;
            
            if ("DRIVER".equals(userType)) {
                emailBody = String.format(
                    "Dear %s,\n\n" +
                    "⏰ URGENT REMINDER: Your ride is starting in 1 HOUR!\n\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                    "RIDE DETAILS\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                    "Ride ID: #%d\n" +
                    "From: %s\n" +
                    "To: %s\n" +
                    "Date: %s\n" +
                    "Time: %s\n\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                    "IMPORTANT ACTIONS REQUIRED\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                    "⚠️ OPTION 1: Cancel Now\n" +
                    "   - If you need to cancel, you must do so NOW\n" +
                    "   - All passengers will receive automatic 100%% refunds\n" +
                    "   - This is your last chance to cancel without penalties\n\n" +
                    "⚠️ OPTION 2: Initiate the Ride on Time\n" +
                    "   - If not cancelling, you MUST initiate the ride at the scheduled time\n" +
                    "   - Open the RideHub app and start the ride when ready\n" +
                    "   - Passengers are counting on you!\n\n" +
                    "⚠️ WARNING: Consequences of Not Initiating\n" +
                    "   - If you do NOT cancel AND do NOT initiate the ride:\n" +
                    "   - You will receive ONE STRIKE on your driver account\n" +
                    "   - Passengers will NOT receive refunds\n" +
                    "   - Multiple strikes may lead to account suspension\n\n" +
                    "Please act responsibly and consider your passengers.\n\n" +
                    "Best regards,\n" +
                    "The RideHub Team",
                    user.getName(),
                    ride.getId(),
                    ride.getSource(),
                    ride.getDestination(),
                    ride.getRideDate().format(dateFormatter),
                    ride.getRideTime().format(timeFormatter)
                );
            } else {
                emailBody = String.format(
                    "Dear %s,\n\n" +
                    "⏰ URGENT REMINDER: Your ride is starting in 1 HOUR!\n\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                    "RIDE DETAILS\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                    "Ride ID: #%d\n" +
                    "From: %s\n" +
                    "To: %s\n" +
                    "Date: %s\n" +
                    "Time: %s\n\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                    "IMPORTANT INFORMATION\n" +
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                    "⚠️ Last Chance to Cancel with Refund\n" +
                    "   - If you need to cancel, you must do so NOW\n" +
                    "   - After the 1-hour mark, cancellations will NOT be refunded\n" +
                    "   - Login to your RideHub account to cancel if needed\n\n" +
                    "⚠️ What If the Ride is Not Initiated?\n" +
                    "   - If the driver does NOT initiate the ride at the scheduled time:\n" +
                    "   - NO REFUND will be issued to you\n" +
                    "   - You will receive ONE STRIKE on your passenger account\n" +
                    "   - The driver will also receive penalties\n\n" +
                    "⚠️ What You Should Do:\n" +
                    "   - Be ready at your pickup location on time\n" +
                    "   - Have your phone charged and RideHub app open\n" +
                    "   - Contact the driver if you have any questions\n\n" +
                    "We expect the ride to proceed as scheduled. If there are any issues, " +
                    "please contact support immediately.\n\n" +
                    "Have a safe journey!\n\n" +
                    "Best regards,\n" +
                    "The RideHub Team",
                    user.getName(),
                    ride.getId(),
                    ride.getSource(),
                    ride.getDestination(),
                    ride.getRideDate().format(dateFormatter),
                    ride.getRideTime().format(timeFormatter)
                );
            }
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send one hour warning email: " + e.getMessage());
        }
    }
    
    public void sendTripStartedEmail(User passenger, Ride ride, Booking booking) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Your Ride Has Started!");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "Your ride has started! The driver is on the way to pick you up.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "RIDE DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Booking ID: #%d\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Time: %s\n" +
                "Pickup: %s\n\n" +
                "Driver: %s\n" +
                "Contact: %s\n" +
                "Vehicle: %s (%s)\n\n" +
                "Please be ready at your pickup location.\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                booking.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                booking.getPickupLocation(),
                ride.getDriver().getName(),
                ride.getDriver().getContact(),
                ride.getDriver().getCarModel(),
                ride.getDriver().getLicensePlate()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send trip started email: " + e.getMessage());
        }
    }
    
    public void sendOnboardingOTPEmail(User passenger, Ride ride, Booking booking, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Your Onboarding OTP");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "The driver has arrived at your pickup location!\n\n" +
                "Your Onboarding OTP is:\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "        %s\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Please share this OTP with the driver to confirm boarding.\n\n" +
                "This OTP is valid for 15 minutes.\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                otp
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send onboarding OTP email: " + e.getMessage());
        }
    }
    
    public void sendSafeJourneyEmail(User passenger, Ride ride, Booking booking) {
        sendPassengerOnboardedEmail(passenger, booking, ride);
    }
    
    public void sendPassengerOnboardedEmail(User passenger, Booking booking, Ride ride) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Journey Started - Have a Safe Trip! 🚗");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "✅ You have been successfully onboarded!\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "JOURNEY DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Booking ID: #%d\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Departure Time: %s\n" +
                "Pickup: %s\n" +
                "Drop: %s\n\n" +
                "Driver: %s\n" +
                "Vehicle: %s (%s)\n" +
                "Contact: %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "🆘 EMERGENCY SOS FEATURE 🆘\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "For your safety, we have activated the SOS (Emergency) feature for this journey.\n\n" +
                "HOW TO USE SOS:\n" +
                "1. Open the RideHub app\n" +
                "2. Go to 'Active Rides'\n" +
                "3. Tap the red 'SOS' button\n" +
                "4. Emergency services and your emergency contacts will be notified\n\n" +
                "⚠️ ONLY use the SOS feature in case of a real emergency.\n" +
                "⚠️ Misuse of the SOS feature may result in account suspension.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "SAFETY TIPS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "✓ Keep your phone charged throughout the journey\n" +
                "✓ Share your trip details with family/friends\n" +
                "✓ Verify the driver and vehicle details before boarding\n" +
                "✓ Always wear your seatbelt\n" +
                "✓ If you feel unsafe at any time, use the SOS feature\n\n" +
                "We wish you a safe and pleasant journey!\n\n" +
                "For any non-emergency queries during the ride, you can contact " +
                "our support team at support@ridehub.com\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                booking.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                booking.getPickupLocation(),
                booking.getDropLocation(),
                ride.getDriver().getName(),
                ride.getDriver().getCarModel(),
                ride.getDriver().getLicensePlate(),
                ride.getDriver().getContact()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send passenger onboarded email: " + e.getMessage());
        }
    }
    
    public void sendDeboardingOTPEmail(User passenger, Ride ride, Booking booking, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Your Deboarding OTP");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "The driver has reached your drop location!\n\n" +
                "Your Deboarding OTP is:\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "        %s\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Please share this OTP with the driver to confirm deboarding.\n\n" +
                "This OTP is valid for 15 minutes.\n\n" +
                "We hope you had a safe journey!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                otp
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send deboarding OTP email: " + e.getMessage());
        }
    }
    
    public void sendTripCompletedEmail(User passenger, Ride ride, Booking booking) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Trip Completed Successfully!");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "Thank you for riding with RideHub! ✅\n\n" +
                "Your trip has been completed successfully.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "TRIP SUMMARY\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Booking ID: #%d\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Driver: %s\n" +
                "Amount Paid: ₹%.2f\n\n" +
                "We hope you had a pleasant journey!\n\n" +
                "Please rate your experience and help us improve our service.\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                booking.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getDriver().getName(),
                booking.getFinalPrice() != null ? booking.getFinalPrice() : booking.getMaximumPrice()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send trip completed email: " + e.getMessage());
        }
    }
    
    public void sendTripCompletedDriverEmail(User driver, Ride ride) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(driver.getEmail());
            message.setSubject("RideHub - Trip Completed! Funds Unlocked");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "Congratulations! Your trip has been completed successfully! 🎉\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "TRIP DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Ride ID: #%d\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "WALLET UPDATE\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "✅ Your funds have been UNLOCKED!\n" +
                "✅ Earnings are now available for withdrawal\n" +
                "✅ You can withdraw funds to your bank account anytime\n\n" +
                "Visit your Driver Dashboard to check your wallet balance " +
                "and initiate withdrawals.\n\n" +
                "Thank you for being a valued RideHub driver!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                driver.getName(),
                ride.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter)
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send trip completed driver email: " + e.getMessage());
        }
    }
    
    public void sendETAUpdateEmail(User passenger, Ride ride, Booking booking) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Driver ETA Update");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "The driver is on the way to your pickup location.\n\n" +
                "Booking ID: #%d\n" +
                "Pickup: %s\n" +
                "Driver: %s\n" +
                "Vehicle: %s (%s)\n\n" +
                "Please be ready at your pickup point.\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                booking.getId(),
                booking.getPickupLocation(),
                ride.getDriver().getName(),
                ride.getDriver().getCarModel(),
                ride.getDriver().getLicensePlate()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send ETA update email: " + e.getMessage());
        }
    }
    
    public void sendPassengerCancellationEmail(User passenger, Booking booking, Object refundCalc, String reason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Booking Cancellation Confirmed");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "Your booking has been cancelled successfully.\n\n" +
                "Booking ID: #%d\n" +
                "Reason: %s\n\n" +
                "Refund will be processed according to our cancellation policy.\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                booking.getId(),
                reason
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send passenger cancellation email: " + e.getMessage());
        }
    }
    
    public void sendDriverPassengerCancelledEmail(User driver, Booking booking, User passenger) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(driver.getEmail());
            message.setSubject("RideHub - Passenger Cancelled Booking");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "A passenger has cancelled their booking for your ride.\n\n" +
                "Passenger: %s\n" +
                "Booking ID: #%d\n" +
                "Ride: %s to %s\n\n" +
                "The seat is now available for other passengers.\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                driver.getName(),
                passenger.getName(),
                booking.getId(),
                booking.getRide().getSource(),
                booking.getRide().getDestination()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send driver passenger cancelled email: " + e.getMessage());
        }
    }
    
    public void sendDriverCancellationEmailToPassenger(User passenger, Ride ride, String reason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Ride Cancelled by Driver");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "We regret to inform you that the driver has cancelled the ride.\n\n" +
                "Ride Details:\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Reason: %s\n\n" +
                "A full refund will be processed automatically.\n\n" +
                "We apologize for the inconvenience.\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                reason
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send driver cancellation email to passenger: " + e.getMessage());
        }
    }
    
    public void sendBookingCancellationToDriver(User driver, User passenger, Booking booking, Ride ride) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(driver.getEmail());
            message.setSubject("RideHub - Passenger Cancelled Booking");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "A passenger has cancelled their booking for your ride.\n\n" +
                "Passenger Details:\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "Name: %s\n" +
                "Seats Cancelled: %d\n" +
                "Booking ID: #%d\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Ride Details:\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s at %s\n\n" +
                "Updated Available Seats: %d / %d\n\n" +
                "The cancelled seats are now available for other passengers to book.\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                driver.getName(),
                passenger.getName(),
                booking.getSeatsBooked(),
                booking.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                ride.getAvailableSeats(),
                ride.getTotalSeats()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send booking cancellation email to driver: " + e.getMessage());
        }
    }
    
    public void sendRideCancellationEmail(User passenger, Booking booking, Ride ride, User driver) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Ride Cancelled by Driver");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "We regret to inform you that the driver has cancelled the following ride:\n\n" +
                "Ride Details:\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s at %s\n" +
                "Driver: %s\n" +
                "Booking ID: #%d\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Action Taken:\n" +
                "• Your booking has been cancelled\n" +
                "• A full refund will be processed within 5-7 business days if payment was made\n" +
                "• You can search for alternative rides on RideHub\n\n" +
                "We apologize for any inconvenience caused.\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                driver.getName(),
                booking.getId()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send ride cancellation email to passenger: " + e.getMessage());
        }
    }
    
    public void sendDriverJourneyStartedEmail(User driver, Ride ride) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(driver.getEmail());
            message.setSubject("RideHub - Journey Started Successfully!");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            // Get confirmed bookings count
            List<Booking> confirmedBookings = bookingRepository.findByRide(ride).stream()
                    .filter(b -> b.getStatus() == Booking.BookingStatus.CONFIRMED)
                    .collect(Collectors.toList());
            
            int totalPassengers = confirmedBookings.size();
            int totalSeatsBooked = confirmedBookings.stream()
                    .mapToInt(Booking::getSeatsBooked)
                    .sum();
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "✅ Your journey has started successfully! �\ude97\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "RIDE DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Ride ID: #%d\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Scheduled Time: %s\n" +
                "Journey Started: NOW\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "PASSENGER INFORMATION\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Total Passengers: %d\n" +
                "Total Seats Booked: %d\n\n" +
                "All confirmed passengers have been notified that the journey has started.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "NEXT STEPS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "1. Pick up passengers at their designated pickup locations\n" +
                "2. Generate and validate OTPs for each passenger onboarding\n" +
                "3. Complete the ride by dropping off all passengers\n" +
                "4. Generate and validate OTPs for each passenger deboarding\n" +
                "5. Once all passengers are deboarded, your earnings will be unlocked\n\n" +
                "Drive safely and have a pleasant journey!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                driver.getName(),
                ride.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                ride.getRideTime().format(timeFormatter),
                totalPassengers,
                totalSeatsBooked
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send driver journey started email: " + e.getMessage());
        }
    }
    
    public void sendRideStartedEmailToDriver(User driver, Ride ride, Booking booking) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(driver.getEmail());
            message.setSubject("RideHub - Ride Started Successfully!");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "✅ Your ride has started! 🚗\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "RIDE DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Ride ID: #%d\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Started At: %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "PASSENGER INFORMATION\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Passenger: %s\n" +
                "Contact: %s\n" +
                "Seats: %d\n" +
                "Pickup: %s\n" +
                "Drop: %s\n\n" +
                "Both you and the passenger have confirmed the ride start.\n\n" +
                "Please ensure a safe journey for all passengers!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                driver.getName(),
                ride.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                java.time.LocalTime.now().format(timeFormatter),
                booking.getPassenger().getName(),
                booking.getPassenger().getContact(),
                booking.getSeatsBooked(),
                booking.getPickupLocation(),
                booking.getDropLocation()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send ride started email to driver: " + e.getMessage());
        }
    }
    
    public void sendRideStartedEmailToPassenger(User passenger, Ride ride, Booking booking) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Your Ride Has Started!");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "✅ Your ride has started! 🚗\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "RIDE DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Booking ID: #%d\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Started At: %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "DRIVER INFORMATION\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Driver: %s\n" +
                "Contact: %s\n" +
                "Vehicle: %s (%s)\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "YOUR JOURNEY\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Pickup: %s\n" +
                "Drop: %s\n" +
                "Seats: %d\n" +
                "Fare: ₹%.2f\n\n" +
                "Both you and the driver have confirmed the ride start.\n\n" +
                "Have a safe and pleasant journey!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                booking.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                java.time.LocalDateTime.now().format(timeFormatter),
                ride.getDriver().getName(),
                ride.getDriver().getContact(),
                ride.getDriver().getCarModel(),
                ride.getDriver().getLicensePlate(),
                booking.getPickupLocation(),
                booking.getDropLocation(),
                booking.getSeatsBooked(),
                booking.getFinalPrice() != null ? booking.getFinalPrice() : booking.getMaximumPrice()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send ride started email to passenger: " + e.getMessage());
        }
    }
    
    public void sendRideEndedEmailToDriver(User driver, Ride ride, Booking booking) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(driver.getEmail());
            message.setSubject("RideHub - Ride Completed! Earnings Released");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "✅ Ride completed successfully! 🎉\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "RIDE DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Ride ID: #%d\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Completed At: %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "PASSENGER INFORMATION\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Passenger: %s\n" +
                "Seats: %d\n" +
                "Fare Collected: ₹%.2f\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "EARNINGS UPDATE\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "✓ Your earnings for this ride have been released\n" +
                "✓ Funds transferred from locked to available balance\n" +
                "✓ You can now withdraw to your bank account\n\n" +
                "Thank you for providing excellent service!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                driver.getName(),
                ride.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                java.time.LocalDateTime.now().format(timeFormatter),
                booking.getPassenger().getName(),
                booking.getSeatsBooked(),
                booking.getFinalPrice() != null ? booking.getFinalPrice() : booking.getMaximumPrice()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send ride ended email to driver: " + e.getMessage());
        }
    }
    
    public void sendRideEndedEmailToPassenger(User passenger, Ride ride, Booking booking) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(passenger.getEmail());
            message.setSubject("RideHub - Ride Completed! Thank You");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "✅ Your ride has been completed successfully! 🎉\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "RIDE SUMMARY\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Booking ID: #%d\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Completed At: %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "JOURNEY DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Driver: %s\n" +
                "Vehicle: %s (%s)\n" +
                "Seats: %d\n" +
                "Total Fare: ₹%.2f\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "RATE YOUR EXPERIENCE\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "We hope you had a pleasant journey! Please take a moment to\n" +
                "rate your experience and help us improve our service.\n\n" +
                "Log in to your RideHub account to leave a review.\n\n" +
                "Thank you for choosing RideHub!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                passenger.getName(),
                booking.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                java.time.LocalDateTime.now().format(timeFormatter),
                ride.getDriver().getName(),
                ride.getDriver().getCarModel(),
                ride.getDriver().getLicensePlate(),
                booking.getSeatsBooked(),
                booking.getFinalPrice() != null ? booking.getFinalPrice() : booking.getMaximumPrice()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send ride ended email to passenger: " + e.getMessage());
        }
    }
    
    public void sendFundsTransferredEmail(User driver, Booking booking, double amount, double newAvailableBalance) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(driver.getEmail());
            message.setSubject("RideHub - ₹" + String.format("%.2f", amount) + " Transferred to Available Balance!");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a");
            Ride ride = booking.getRide();
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "💰 Great news! Your earnings have been transferred to your available balance!\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "TRANSACTION DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Amount Transferred: ₹%.2f\n" +
                "Transaction Date: %s\n" +
                "Transaction Type: Locked to Available Balance\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "RIDE DETAILS\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Booking ID: #%d\n" +
                "Ride: %s to %s\n" +
                "Date: %s\n" +
                "Passenger: %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "WALLET UPDATE\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "New Available Balance: ₹%.2f\n\n" +
                "✓ Funds are now available for withdrawal\n" +
                "✓ You can transfer to your bank account anytime\n" +
                "✓ Withdrawals are processed within 24-48 hours\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "HOW TO WITHDRAW\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "1. Log in to your RideHub Driver Dashboard\n" +
                "2. Navigate to 'HubWallet'\n" +
                "3. Click 'Withdraw Funds'\n" +
                "4. Enter amount and bank details\n" +
                "5. Confirm withdrawal\n\n" +
                "Your funds will be credited to your bank account within 24-48 hours.\n\n" +
                "Thank you for completing another successful ride!\n\n" +
                "Best regards,\n" +
                "The RideHub Team",
                driver.getName(),
                amount,
                java.time.LocalDateTime.now().format(dateTimeFormatter),
                booking.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                booking.getPassenger().getName(),
                newAvailableBalance
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send funds transferred email: " + e.getMessage());
        }
    }
    
    public void sendFundsUnlockedEmail(User driver, Ride ride, double totalAmount) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@ridehub.com");
            message.setTo(driver.getEmail());
            message.setSubject("RideHub - ₹" + String.format("%.2f", totalAmount) + " Unlocked! Funds Available for Withdrawal");
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
            
            String emailBody = String.format(
                "Dear %s,\n\n" +
                "✅ Great news! Your ride has been completed and your earnings are now available! �\udcb0\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "RIDE COMPLETED\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Ride ID: #%d\n" +
                "From: %s\n" +
                "To: %s\n" +
                "Date: %s\n" +
                "Completion Time: %s\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "EARNINGS UPDATE\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "✅ Status: FUNDS UNLOCKED\n" +
                "✅ Amount Available: ₹%.2f\n\n" +
                "Your earnings have been moved from locked balance to available balance in your HubWallet.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "WHAT YOU CAN DO NOW\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "• Log in to your RideHub Driver Dashboard\n" +
                "• Navigate to the 'HubWallet' section\n" +
                "• View your updated available balance\n" +
                "• Initiate withdrawal to your bank account anytime\n" +
                "• Withdrawals are processed within 24-48 hours\n\n" +
                "Thank you for completing this ride successfully! We appreciate your commitment to " +
                "providing excellent service to our passengers.\n\n" +
                "Keep up the great work!\n\n" +
                "Best regards,\n" +
                "The RideHub Team\n\n" +
                "P.S. You can view your complete transaction history in your wallet dashboard.",
                driver.getName(),
                ride.getId(),
                ride.getSource(),
                ride.getDestination(),
                ride.getRideDate().format(dateFormatter),
                java.time.LocalDateTime.now().format(timeFormatter),
                totalAmount
            );
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send funds unlocked email: " + e.getMessage());
        }
    }
}
