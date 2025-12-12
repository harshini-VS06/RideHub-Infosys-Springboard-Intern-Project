import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  Users, 
  Shield, 
  MapPin, 
  CreditCard, 
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Wallet,
  TrendingUp,
  UserCheck,
  FileText,
  ArrowRight,
  Star,
  Navigation,
  Lock,
  Ban,
  IndianRupee,
  Search,
  Bell,
  Zap,
  Globe,
  Heart,
  Leaf,
  DollarSign,
  MessageCircle,
  Award,
  Info,
  Download,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronDown,
  CheckSquare,
  Calendar,
  User,
  Settings,
  HelpCircle,
  BookOpen,
  Target,
  Route
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
const logoImage = '/ridehub-logo.png';

export function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ fontFamily: 'Lora, serif', background: 'linear-gradient(135deg, #F9C05E 0%, #F7B34C 50%, #EF8F31 100%)' }}>
      {/* Animated Extending Road Background */}
      <AnimatedRoadBackground scrollY={scrollY} />

      {/* Main Content Wrapper */}
      <div className="relative z-10">
        {/* Fixed Header */}
        <motion.header 
          className="fixed top-0 left-0 right-0 z-50 px-6 py-3 transition-all duration-300"
          style={{
            backgroundColor: scrollY > 50 ? 'rgba(61, 90, 93, 0.95)' : 'transparent',
            backdropFilter: scrollY > 50 ? 'blur(10px)' : 'none',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => scrollToSection('home')}
            >
              <img src={logoImage} alt="RideHub" className="h-12 w-12" />
              <div>
                <div className="text-2xl text-white">RideHub</div>
                <div className="text-xs" style={{ color: '#F9C05E' }}>Your Journey Begins</div>
              </div>
            </motion.div>

            {/* Navigation */}
            <nav className="hidden md:flex gap-6">
              <NavLink onClick={() => scrollToSection('features')}>Features</NavLink>
              <NavLink onClick={() => scrollToSection('how-it-works')}>How It Works</NavLink>
              <NavLink onClick={() => scrollToSection('pricing')}>Pricing</NavLink>
              <NavLink onClick={() => scrollToSection('safety')}>Safety</NavLink>
              <NavLink onClick={() => scrollToSection('faq')}>FAQ</NavLink>
            </nav>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/login')}
                className="text-white hover:opacity-90 text-lg font-semibold"
                style={{ 
                  backgroundColor: '#3D5A5D',
                  padding: '12px 32px',
                  fontSize: '1.125rem'
                }}
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className="text-white hover:opacity-90 text-lg font-semibold"
                style={{ 
                  backgroundColor: '#EF8F31',
                  padding: '12px 32px',
                  fontSize: '1.125rem'
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section id="home" className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-6xl mb-6 drop-shadow-lg" style={{ color: '#3D5A5D' }}>
                  Share Your Journey,<br />Share the Cost
                </h1>
                <p className="text-xl mb-8" style={{ color: '#3D5A5D' }}>
                  India's intelligent carpooling platform with smart route matching, 
                  secure payments, and real-time notifications. Save money, reduce traffic, meet new people.
                </p>
                <div className="flex gap-4">
                  <Button
                    onClick={() => navigate('/register')}
                    className="text-white px-8 py-6 text-lg shadow-xl"
                    style={{ backgroundColor: '#3D5A5D' }}
                  >
                    <Search className="mr-2" /> Find a Ride
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    className="px-8 py-6 text-lg border-2 shadow-xl"
                    style={{ borderColor: '#3D5A5D', color: '#3D5A5D', backgroundColor: 'white' }}
                  >
                    <Car className="mr-2" /> Offer a Ride
                  </Button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mt-12">
                  <StatCard number="10K+" label="Active Users" />
                  <StatCard number="50K+" label="Rides Completed" />
                  <StatCard number="₹2Cr+" label="Savings Generated" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex justify-center"
              >
                <img src={logoImage} alt="RideHub" className="w-96 h-96 animate-float drop-shadow-2xl" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              title="Key Features" 
              subtitle="Everything you need for a smart carpooling experience"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              <FeatureCard
                icon={<Route className="w-8 h-8" />}
                title="Smart Route Matching"
                description="Find rides that match your exact route or pass through your locations. Get 2-3x more ride options with our intelligent algorithm showing direct and enroute rides."
              />
              <FeatureCard
                icon={<IndianRupee className="w-8 h-8" />}
                title="Fair Price Sharing"
                description="Pay only your fair share! Book at maximum price, pay less when more join. Example: Book at ₹2,000, pay only ₹666 when 3 passengers join!"
              />
              <FeatureCard
                icon={<Lock className="w-8 h-8" />}
                title="Secure Payments"
                description="Powered by Razorpay. Pay 24 hours before ride, secure wallet for drivers, instant confirmations, automatic refunds."
              />
              <FeatureCard
                icon={<Bell className="w-8 h-8" />}
                title="Real-Time Notifications"
                description="Stay informed with instant alerts for bookings, payments, WebSocket notifications, email confirmations, and payment reminders."
              />
              <FeatureCard
                icon={<Navigation className="w-8 h-8" />}
                title="Google Maps Integration"
                description="Real-time suggestions as you type, places and landmarks, GPS coordinates for precise matching, India-specific location search."
              />
              <FeatureCard
                icon={<Shield className="w-8 h-8" />}
                title="Safe & Verified"
                description="Verified drivers and passengers, rating system, emergency SOS, 24/7 support, and comprehensive safety features."
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              title="How It Works" 
              subtitle="Simple steps to start your journey"
            />

            {/* For Passengers */}
            <div className="mt-16">
              <h3 className="text-3xl mb-8 text-center text-white">For Passengers</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <ProcessStep
                  number="1"
                  title="Search Your Ride"
                  description="Enter locations using Google Maps, select date. See 5-8 ride options on average."
                  icon={<Search />}
                />
                <ProcessStep
                  number="2"
                  title="Choose & Book"
                  description="Compare drivers, prices, ratings. Book instantly with tentative status."
                  icon={<CheckCircle />}
                />
                <ProcessStep
                  number="3"
                  title="Share the Cost"
                  description="More passengers = Lower price. Final price calculated 24 hours before."
                  icon={<Users />}
                />
                <ProcessStep
                  number="4"
                  title="Pay Securely"
                  description="Pay via Razorpay 24 hours before ride. Instant confirmation."
                  icon={<CreditCard />}
                />
                <ProcessStep
                  number="5"
                  title="Enjoy Your Ride"
                  description="Meet at pickup point, travel safely, rate your experience."
                  icon={<Star />}
                />
              </div>
            </div>

            {/* For Drivers */}
            <div className="mt-20">
              <h3 className="text-3xl mb-8 text-center text-white">For Drivers</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ProcessStep
                  number="1"
                  title="Post Your Ride"
                  description="Enter route, set date/time, define price per km, add vehicle details."
                  icon={<MapPin />}
                />
                <ProcessStep
                  number="2"
                  title="Get Bookings"
                  description="Smart matching finds passengers. Receive instant notifications."
                  icon={<Bell />}
                />
                <ProcessStep
                  number="3"
                  title="Earn Money"
                  description="Payments to HubWallet, funds locked until completion, withdraw anytime."
                  icon={<Wallet />}
                />
                <ProcessStep
                  number="4"
                  title="Complete the Ride"
                  description="Pick up passengers, complete journey, wallet unlocked, build rating."
                  icon={<Award />}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Registration Guide */}
        <section id="registration" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              title="Registration Guide" 
              subtitle="Create your account in minutes"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
              {/* Passenger Registration */}
              <Card className="p-8 border-2 border-white/30 bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl text-white">As a Passenger</h3>
                </div>
                <div className="space-y-4">
                  <RegistrationStep step="1" title="Sign Up" description="Visit ridehub.com/register, enter details, select 'Passenger' role" />
                  <RegistrationStep step="2" title="Profile Setup" description="Add photo, verify email, emergency contact, set preferences" />
                  <RegistrationStep step="3" title="Start Booking" description="Search rides immediately, no vehicle details needed" />
                </div>
              </Card>

              {/* Driver Registration */}
              <Card className="p-8 border-2 border-white/30 bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl text-white">As a Driver</h3>
                </div>
                <div className="space-y-4">
                  <RegistrationStep step="1" title="Sign Up" description="Register with personal details, select 'Driver' role" />
                  <RegistrationStep step="2" title="Vehicle Details" description="Car model, license plate, capacity, upload photos" />
                  <RegistrationStep step="3" title="Verification" description="Upload license, verify contact, identity check (24h approval)" />
                  <RegistrationStep step="4" title="Post First Ride" description="Create ride, set pricing, start earning" />
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Payment System */}
        <section id="pricing" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              title="Payment System" 
              subtitle="Transparent and secure pricing"
            />

            {/* Price Sharing Explained */}
            <Card className="p-10 mt-12 bg-white/10 backdrop-blur-sm border-2 border-white/30">
              <h3 className="text-3xl mb-6 text-center text-white">How Price Sharing Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl mb-4 text-white">Example Ride: Chennai → Bangalore</h4>
                  <div className="space-y-3" style={{ color: '#3D5A5D' }}>
                    <p>📍 Distance: 350 km</p>
                    <p>💰 Rate: ₹15 per km</p>
                    <p>💵 Total trip cost: ₹5,250</p>
                  </div>
                  
                  <div className="mt-6 p-4 rounded-lg bg-white/20">
                    <p className="font-semibold mb-2 text-white">Scenario 1: You book 2 seats</p>
                    <p className="text-sm" style={{ color: '#3D5A5D' }}>Maximum you'll pay: ₹5,250</p>
                    <p className="text-sm" style={{ color: '#3D5A5D' }}>If 3 more passengers join (6 seats total):</p>
                    <p className="text-sm" style={{ color: '#3D5A5D' }}>Final price per seat: ₹5,250 ÷ 6 = ₹875</p>
                    <p className="text-lg mt-2 text-white">Your final price: ₹1,750</p>
                    <p className="text-lg" style={{ color: '#3D5A5D' }}>You save: ₹3,500! 💰</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xl mb-4 text-white">Payment Timeline</h4>
                  <div className="space-y-4">
                    <TimelineItem 
                      title="Day of Booking"
                      description="TENTATIVE status, maximum price shown, no payment yet"
                      icon={<Calendar />}
                    />
                    <TimelineItem 
                      title="24 Hours Before"
                      description="PAYMENT_PENDING status, final price calculated, payment link sent"
                      icon={<Clock />}
                    />
                    <TimelineItem 
                      title="After Payment"
                      description="CONFIRMED status, driver notified, wallet credited"
                      icon={<CheckCircle />}
                    />
                    <TimelineItem 
                      title="After Ride"
                      description="Wallet unlocked, can withdraw, ride marked complete"
                      icon={<Award />}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Pricing Examples */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <PricingCard
                title="Short Trip"
                subtitle="City Commute"
                distance="25 km"
                rate="₹15/km"
                total="₹375"
                perPerson="₹187.50"
                passengers="2"
                savings="60% vs Cab"
              />
              <PricingCard
                title="Medium Trip"
                subtitle="Intercity"
                distance="150 km"
                rate="₹18/km"
                total="₹2,700"
                perPerson="₹900"
                passengers="3"
                savings="70% vs Cab"
              />
              <PricingCard
                title="Long Trip"
                subtitle="Interstate"
                distance="148 km"
                rate="₹20/km"
                total="₹2,960"
                perPerson="₹740"
                passengers="4"
                savings="50% vs Cab/Train"
              />
            </div>
          </div>
        </section>

        {/* HubWallet */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              title="Driver HubWallet" 
              subtitle="Manage your earnings seamlessly"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <Card className="p-8 text-center border-2 border-white/30 bg-white/10 backdrop-blur-sm">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-white" />
                <h3 className="text-xl mb-3 text-white">Instant Credits</h3>
                <p style={{ color: '#3D5A5D' }}>Earnings added immediately when passenger pays 24h before ride</p>
              </Card>
              <Card className="p-8 text-center border-2 border-white/30 bg-white/10 backdrop-blur-sm">
                <Lock className="w-16 h-16 mx-auto mb-4 text-white" />
                <h3 className="text-xl mb-3 text-white">Secure Locking</h3>
                <p style={{ color: '#3D5A5D' }}>Funds locked until ride completion for passenger protection</p>
              </Card>
              <Card className="p-8 text-center border-2 border-white/30 bg-white/10 backdrop-blur-sm">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-white" />
                <h3 className="text-xl mb-3 text-white">Easy Withdrawal</h3>
                <p style={{ color: '#3D5A5D' }}>Withdraw to bank anytime, min ₹100, 1-3 business days transfer</p>
              </Card>
            </div>

            <Card className="p-8 mt-8 bg-white/10 backdrop-blur-sm border-2 border-white/30">
              <h3 className="text-2xl mb-6 text-center text-white">Withdrawal Process</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { icon: <Wallet />, text: "Create Rides" },
                  { icon: <Bell />, text: "Get Bookings" },
                  { icon: <CreditCard />, text: "Receive Payments" },
                  { icon: <CheckCircle />, text: "Complete Ride" },
                  { icon: <IndianRupee />, text: "Withdraw Earnings" },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: '#3D5A5D', color: 'white' }}>
                      {item.icon}
                    </div>
                    <p className="text-sm text-white">{item.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Safety Features */}
        <section id="safety" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              title="Safety Features" 
              subtitle="Your security is our top priority"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {/* Passenger Safety */}
              <Card className="p-8 bg-white/10 backdrop-blur-sm border-2 border-white/30">
                <h3 className="text-2xl mb-6 text-white">Passenger Safety</h3>
                <div className="space-y-4">
                  <SafetyItem icon={<UserCheck />} title="Verified Drivers" description="License verification, identity check, background screening" />
                  <SafetyItem icon={<Star />} title="Rating System" description="Rate drivers, view ratings before booking, report issues" />
                  <SafetyItem icon={<Phone />} title="Share Ride Details" description="Share with friends/family, live location, emergency SOS" />
                  <SafetyItem icon={<Users />} title="Gender Preferences" description="Filter for women drivers, women-only rides option" />
                </div>
              </Card>

              {/* Driver Safety */}
              <Card className="p-8 bg-white/10 backdrop-blur-sm border-2 border-white/30">
                <h3 className="text-2xl mb-6 text-white">Driver Safety</h3>
                <div className="space-y-4">
                  <SafetyItem icon={<Lock />} title="Verified Passengers" description="Phone and email verification, identity check for high-value rides" />
                  <SafetyItem icon={<Shield />} title="Payment Protection" description="No cash transactions, payment before ride, automatic refunds" />
                  <SafetyItem icon={<Star />} title="Rating Passengers" description="Rate passenger behavior, view ratings, decline future bookings" />
                  <SafetyItem icon={<HelpCircle />} title="24/7 Support" description="Dispute resolution, emergency helpline, issue reporting" />
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              title="Benefits" 
              subtitle="Why choose RideHub"
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
              <BenefitCard
                icon={<Leaf />}
                title="Environmental Impact"
                description="Reduce carbon footprint, each shared ride = one less car on road"
              />
              <BenefitCard
                icon={<IndianRupee />}
                title="Economic Savings"
                description="Save 50-70% vs solo cab, drivers earn extra income"
              />
              <BenefitCard
                icon={<Heart />}
                title="Social Connection"
                description="Make friends, network with professionals, build community"
              />
              <BenefitCard
                icon={<Zap />}
                title="Convenience"
                description="Book in 3 clicks, Google Maps integration, 24/7 availability"
              />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <SectionHeader 
              title="Frequently Asked Questions" 
              subtitle="Got questions? We've got answers"
            />

            <div className="space-y-4 mt-12">
              <FAQItem 
                question="What is RideHub?"
                answer="RideHub is India's smart ride-sharing platform that connects drivers with empty seats to passengers heading the same way. Our unique price-sharing system and smart route matching make carpooling easy, affordable, and efficient."
              />
              <FAQItem 
                question="When do I need to pay?"
                answer="Payment is required 24 hours before your ride. Until then, your booking is tentative with a maximum price guarantee."
              />
              <FAQItem 
                question="How is pricing calculated?"
                answer="Drivers set their rate per kilometer (₹10-30/km). Total trip cost = Distance × Rate. This cost is shared among all passengers who book. Your final price depends on how many passengers join."
              />
              <FAQItem 
                question="What if the ride gets cancelled?"
                answer="Full automatic refund if driver cancels. If you cancel after payment: 100% refund (>24h before), 50% refund (12-24h before), No refund (<12h before)."
              />
              <FAQItem 
                question="How do I become a driver?"
                answer="Register with driver role, upload vehicle details, verify driving license, complete identity verification, wait for approval (24 hours), then start posting rides!"
              />
              <FAQItem 
                question="When do drivers get paid?"
                answer="Passenger payment is credited to your HubWallet immediately but kept locked until ride completion. After the ride, funds are unlocked and you can withdraw anytime (min ₹100)."
              />
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader 
              title="Support & Help" 
              subtitle="We're here to help you"
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
              <SupportCard icon={<Mail />} title="Email" detail="support@ridehub.com" />
              <SupportCard icon={<Phone />} title="Phone" detail="+91-XXXX-XXXXXX (24/7)" />
              <SupportCard icon={<MessageCircle />} title="Live Chat" detail="9 AM - 9 PM IST" />
              <SupportCard icon={<Clock />} title="Office Hours" detail="Mon-Fri, 10 AM - 6 PM" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl mb-6 text-white drop-shadow-lg">Ready to Get Started?</h2>
            <p className="text-xl mb-8" style={{ color: '#3D5A5D' }}>
              Join thousands of smart commuters saving money and reducing traffic!
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/register')}
                className="text-white px-10 py-6 text-lg shadow-xl"
                style={{ backgroundColor: '#3D5A5D' }}
              >
                Sign Up Now
              </Button>
              <Button
                onClick={() => navigate('/login')}
                className="px-10 py-6 text-lg border-2 shadow-xl"
                style={{ borderColor: '#3D5A5D', color: '#3D5A5D', backgroundColor: 'white' }}
              >
                Login
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#3D5A5D] text-white py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div>
                <img src={logoImage} alt="RideHub" className="h-16 w-16 mb-4" />
                <p style={{ color: '#F9C05E' }}>India's Smart Ride Sharing Platform</p>
                <div className="flex gap-4 mt-4">
                  <Facebook className="w-5 h-5 cursor-pointer" style={{ color: '#F9C05E' }} />
                  <Twitter className="w-5 h-5 cursor-pointer" style={{ color: '#F9C05E' }} />
                  <Instagram className="w-5 h-5 cursor-pointer" style={{ color: '#F9C05E' }} />
                  <Linkedin className="w-5 h-5 cursor-pointer" style={{ color: '#F9C05E' }} />
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="mb-4" style={{ color: '#F9C05E' }}>Quick Links</h4>
                <div className="space-y-2 text-white/70">
                  <p className="cursor-pointer hover:text-white">About Us</p>
                  <p className="cursor-pointer hover:text-white">How It Works</p>
                  <p className="cursor-pointer hover:text-white">Safety</p>
                  <p className="cursor-pointer hover:text-white">Help Center</p>
                  <p className="cursor-pointer hover:text-white">Blog</p>
                </div>
              </div>

              {/* Legal */}
              <div>
                <h4 className="mb-4" style={{ color: '#F9C05E' }}>Legal</h4>
                <div className="space-y-2 text-white/70">
                  <p className="cursor-pointer hover:text-white">Terms of Service</p>
                  <p className="cursor-pointer hover:text-white">Privacy Policy</p>
                  <p className="cursor-pointer hover:text-white">Cancellation Policy</p>
                  <p className="cursor-pointer hover:text-white">Driver Agreement</p>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="mb-4" style={{ color: '#F9C05E' }}>Contact</h4>
                <div className="space-y-2 text-white/70">
                  <p>📧 support@ridehub.com</p>
                  <p>📞 +91-XXXX-XXXXXX</p>
                  <p>🕒 24/7 Support</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/70">
              <p>Payments Powered By: Razorpay | Maps Powered By: Google Maps</p>
              <p className="mt-2">© 2025 RideHub. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Animation CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Animated Road Component that extends with scroll
function AnimatedRoadBackground({ scrollY }: { scrollY: number }) {
  const roadExtension = scrollY * 0.5; // Road extends as you scroll
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <svg
        className="absolute inset-0 w-full"
        style={{ 
          height: `calc(100vh + ${roadExtension}px)`,
          transform: `translateY(${-scrollY * 0.3}px)`,
          transition: 'transform 0.1s ease-out',
        }}
        viewBox={`0 0 1200 ${800 + roadExtension}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#F9C05E', stopOpacity: 0.3 }} />
            <stop offset="50%" style={{ stopColor: '#F7B34C', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: '#EF8F31', stopOpacity: 0.3 }} />
          </linearGradient>
          <radialGradient id="sunGradient" cx="50%" cy="50%">
            <stop offset="0%" style={{ stopColor: '#F9C05E', stopOpacity: 1 }} />
            <stop offset="70%" style={{ stopColor: '#EF8F31', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#F7B34C', stopOpacity: 0.2 }} />
          </radialGradient>
        </defs>
        
        {/* Sun with rays */}
        <circle cx="900" cy="150" r="100" fill="url(#sunGradient)" opacity="0.5" />
        <circle cx="900" cy="150" r="70" fill="#F9C05E" opacity="0.8" />
        
        {/* Sun rays */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 900 + Math.cos(angle) * 80;
          const y1 = 150 + Math.sin(angle) * 80;
          const x2 = 900 + Math.cos(angle) * 120;
          const y2 = 150 + Math.sin(angle) * 120;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#EF8F31"
              strokeWidth="3"
              opacity="0.4"
            />
          );
        })}
        
        {/* Distant hills */}
        <ellipse cx="300" cy="650" rx="400" ry="150" fill="#F7B34C" opacity="0.25" />
        <ellipse cx="700" cy="680" rx="450" ry="140" fill="#EF8F31" opacity="0.2" />
        <ellipse cx="1000" cy="670" rx="380" ry="130" fill="#F9C05E" opacity="0.25" />
        
        {/* Extended winding road that grows with scroll */}
        <path
          d={`M -100 ${800 + roadExtension} Q 50 ${650 + roadExtension * 0.8}, 150 ${550 + roadExtension * 0.7} Q 250 ${450 + roadExtension * 0.6}, 350 ${400 + roadExtension * 0.5} Q 500 ${330 + roadExtension * 0.4}, 650 ${300 + roadExtension * 0.3} Q 800 ${270 + roadExtension * 0.2}, 900 ${200 + roadExtension * 0.1} Q 1000 130, 1100 80 L 1200 50`}
          fill="none"
          stroke="#3D5A5D"
          strokeWidth="180"
          opacity="0.2"
        />
        
        {/* Road edges for depth */}
        <path
          d={`M -100 ${800 + roadExtension} Q 50 ${650 + roadExtension * 0.8}, 150 ${550 + roadExtension * 0.7} Q 250 ${450 + roadExtension * 0.6}, 350 ${400 + roadExtension * 0.5} Q 500 ${330 + roadExtension * 0.4}, 650 ${300 + roadExtension * 0.3} Q 800 ${270 + roadExtension * 0.2}, 900 ${200 + roadExtension * 0.1} Q 1000 130, 1100 80 L 1200 50`}
          fill="none"
          stroke="#3D5A5D"
          strokeWidth="200"
          opacity="0.1"
        />
        
        {/* Center dashed line - animated */}
        <path
          d={`M -100 ${800 + roadExtension} Q 50 ${650 + roadExtension * 0.8}, 150 ${550 + roadExtension * 0.7} Q 250 ${450 + roadExtension * 0.6}, 350 ${400 + roadExtension * 0.5} Q 500 ${330 + roadExtension * 0.4}, 650 ${300 + roadExtension * 0.3} Q 800 ${270 + roadExtension * 0.2}, 900 ${200 + roadExtension * 0.1} Q 1000 130, 1100 80 L 1200 50`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeDasharray="30,20"
          strokeDashoffset={-scrollY * 0.5}
          opacity="0.5"
        />
        
        {/* Side dashed lines */}
        <path
          d={`M -120 ${815 + roadExtension} Q 35 ${665 + roadExtension * 0.8}, 135 ${565 + roadExtension * 0.7} Q 235 ${465 + roadExtension * 0.6}, 335 ${415 + roadExtension * 0.5} Q 485 ${345 + roadExtension * 0.4}, 635 ${315 + roadExtension * 0.3} Q 785 ${285 + roadExtension * 0.2}, 885 ${215 + roadExtension * 0.1} Q 985 145, 1085 95 L 1200 65`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeDasharray="15,10"
          opacity="0.3"
        />
        <path
          d={`M -80 ${785 + roadExtension} Q 65 ${635 + roadExtension * 0.8}, 165 ${535 + roadExtension * 0.7} Q 265 ${435 + roadExtension * 0.6}, 365 ${385 + roadExtension * 0.5} Q 515 ${315 + roadExtension * 0.4}, 665 ${285 + roadExtension * 0.3} Q 815 ${255 + roadExtension * 0.2}, 915 ${185 + roadExtension * 0.1} Q 1015 115, 1115 65 L 1200 35`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeDasharray="15,10"
          opacity="0.3"
        />
        
        {/* Road milestone markers */}
        <circle cx="200" cy={530 + roadExtension * 0.7} r="12" fill="#EF8F31" opacity="0.6" />
        <circle cx="400" cy={380 + roadExtension * 0.5} r="12" fill="#EF8F31" opacity="0.6" />
        <circle cx="700" cy={280 + roadExtension * 0.3} r="12" fill="#EF8F31" opacity="0.6" />
        <circle cx="950" cy={190 + roadExtension * 0.1} r="12" fill="#EF8F31" opacity="0.6" />
        
        {/* Trees along the road */}
        <ellipse cx="80" cy={620 + roadExtension * 0.75} rx="40" ry="60" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="60" cy={600 + roadExtension * 0.75} rx="25" ry="35" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="280" cy={490 + roadExtension * 0.6} rx="45" ry="65" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="260" cy={470 + roadExtension * 0.6} rx="28" ry="40" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="520" cy={350 + roadExtension * 0.4} rx="50" ry="70" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="500" cy={330 + roadExtension * 0.4} rx="30" ry="45" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="820" cy={240 + roadExtension * 0.2} rx="45" ry="65" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="800" cy={220 + roadExtension * 0.2} rx="28" ry="40" fill="#3D5A5D" opacity="0.2" />
        
        {/* Right side trees */}
        <ellipse cx="300" cy={570 + roadExtension * 0.7} rx="38" ry="55" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="320" cy={550 + roadExtension * 0.7} rx="24" ry="35" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="550" cy={420 + roadExtension * 0.5} rx="42" ry="60" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="570" cy={400 + roadExtension * 0.5} rx="26" ry="38" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="780" cy={310 + roadExtension * 0.3} rx="48" ry="68" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="800" cy={290 + roadExtension * 0.3} rx="29" ry="42" fill="#3D5A5D" opacity="0.2" />
        
        <ellipse cx="1020" cy={170 + roadExtension * 0.1} rx="40" ry="58" fill="#3D5A5D" opacity="0.15" />
        <ellipse cx="1040" cy={150 + roadExtension * 0.1} rx="25" ry="36" fill="#3D5A5D" opacity="0.2" />
        
        {/* Clouds */}
        <ellipse cx="200" cy="120" rx="60" ry="30" fill="#FFFFFF" opacity="0.3" />
        <ellipse cx="230" cy="130" rx="50" ry="25" fill="#FFFFFF" opacity="0.3" />
        <ellipse cx="170" cy="130" rx="45" ry="22" fill="#FFFFFF" opacity="0.3" />
        
        <ellipse cx="600" cy="100" rx="70" ry="35" fill="#FFFFFF" opacity="0.25" />
        <ellipse cx="640" cy="110" rx="55" ry="28" fill="#FFFFFF" opacity="0.25" />
      </svg>
    </div>
  );
}

// Helper Components
function NavLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-lg font-semibold transition-colors px-3 py-2"
      style={{ 
        color: '#3D5A5D',
        textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#EF8F31';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#3D5A5D';
      }}
    >
      {children}
    </button>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl mb-1" style={{ color: '#3D5A5D' }}>{number}</div>
      <div className="text-sm" style={{ color: '#3D5A5D' }}>{label}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h2 className="text-4xl mb-4 drop-shadow-lg" style={{ color: '#3D5A5D' }}>{title}</h2>
      <p className="text-xl" style={{ color: '#3D5A5D' }}>{subtitle}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 h-full bg-white/90 backdrop-blur-sm border-2 border-white/50 shadow-lg">
        <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: '#EF8F31' }}>
          <div className="text-white">{icon}</div>
        </div>
        <h3 className="text-xl mb-3" style={{ color: '#3D5A5D' }}>{title}</h3>
        <p className="text-gray-700">{description}</p>
      </Card>
    </motion.div>
  );
}

function ProcessStep({ number, title, description, icon }: any) {
  return (
    <Card className="p-6 relative bg-white/90 backdrop-blur-sm border-2 border-white/50 shadow-lg">
      <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#3D5A5D' }}>
        {number}
      </div>
      <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center mx-auto" style={{ backgroundColor: '#EF8F31' }}>
        <div className="text-white">{icon}</div>
      </div>
      <h4 className="text-lg mb-2 text-center" style={{ color: '#3D5A5D' }}>{title}</h4>
      <p className="text-sm text-center text-gray-700">{description}</p>
    </Card>
  );
}

function RegistrationStep({ step, title, description }: any) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: '#3D5A5D' }}>
        {step}
      </div>
      <div>
        <h4 className="mb-1 text-white">{title}</h4>
        <p className="text-sm" style={{ color: '#3D5A5D' }}>{description}</p>
      </div>
    </div>
  );
}

function TimelineItem({ title, description, icon }: any) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/20">
        <div className="text-white">{icon}</div>
      </div>
      <div>
        <h4 className="mb-1 text-white">{title}</h4>
        <p className="text-sm" style={{ color: '#3D5A5D' }}>{description}</p>
      </div>
    </div>
  );
}

function PricingCard({ title, subtitle, distance, rate, total, perPerson, passengers, savings }: any) {
  return (
    <Card className="p-6 border-2 border-white/50 bg-white/90 backdrop-blur-sm shadow-lg">
      <h4 className="text-xl mb-1" style={{ color: '#3D5A5D' }}>{title}</h4>
      <p className="text-sm mb-4 text-gray-600">{subtitle}</p>
      <div className="space-y-2 text-sm text-gray-700">
        <p>📍 {distance}</p>
        <p>💰 {rate}</p>
        <p>💵 Total: {total}</p>
        <div className="border-t border-gray-300 pt-2 mt-2">
          <p className="text-lg" style={{ color: '#EF8F31' }}>₹{perPerson} per person</p>
          <p className="text-xs text-gray-600">with {passengers} passengers</p>
          <p className="text-sm mt-2" style={{ color: '#3D5A5D' }}>✓ {savings}</p>
        </div>
      </div>
    </Card>
  );
}

function SafetyItem({ icon, title, description }: any) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EF8F31' }}>
        <div className="text-white">{icon}</div>
      </div>
      <div>
        <h4 className="mb-1" style={{ color: '#3D5A5D' }}>{title}</h4>
        <p className="text-sm text-gray-700">{description}</p>
      </div>
    </div>
  );
}

function BenefitCard({ icon, title, description }: any) {
  return (
    <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border-2 border-white/50 shadow-lg">
      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#EF8F31' }}>
        <div className="text-white">{icon}</div>
      </div>
      <h4 className="text-lg mb-2" style={{ color: '#3D5A5D' }}>{title}</h4>
      <p className="text-sm text-gray-700">{description}</p>
    </Card>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="p-6 cursor-pointer bg-white/90 backdrop-blur-sm border-2 border-white/50 shadow-lg" onClick={() => setIsOpen(!isOpen)}>
      <div className="flex justify-between items-center">
        <h4 className="text-lg" style={{ color: '#3D5A5D' }}>{question}</h4>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: '#EF8F31' }} />
      </div>
      {isOpen && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 text-gray-700"
        >
          {answer}
        </motion.p>
      )}
    </Card>
  );
}

function SupportCard({ icon, title, detail }: any) {
  return (
    <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border-2 border-white/50 shadow-lg">
      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#EF8F31' }}>
        <div className="text-white">{icon}</div>
      </div>
      <h4 className="mb-2" style={{ color: '#3D5A5D' }}>{title}</h4>
      <p className="text-sm text-gray-700">{detail}</p>
    </Card>
  );
}