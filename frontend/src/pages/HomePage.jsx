import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Users, MessageCircle, Shield, Star, ArrowRight, Home, MapPin, Heart } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleOnHover = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 }
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero min-h-screen bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40"></div>
        
        <motion.div 
          className="hero-content text-center z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-6"
            >
              <div className="flex justify-center mb-4">
                <motion.div 
                  className="p-4 bg-primary/10 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Home className="w-12 h-12 text-primary" />
                </motion.div>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                FindaRoomie
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-xl md:text-2xl mb-8 text-base-content/80 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Find your perfect roommate and room with ease. Connect with like-minded people and discover amazing living spaces in your city.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Link to="/rooms" className="btn btn-primary btn-lg text-white group">
                <Search className="w-5 h-5 mr-2" />
                Find Rooms
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg group">
                <Users className="w-5 h-5 mr-2" />
                Join Community
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Floating Elements */}
        <motion.div 
          className="absolute top-20 left-10 opacity-20"
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <MapPin className="w-8 h-8 text-primary" />
        </motion.div>
        <motion.div 
          className="absolute bottom-20 right-10 opacity-20"
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Heart className="w-6 h-6 text-secondary" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose FindaRoomie?</h2>
            <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
              We make finding roommates and rooms simple, safe, and social
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Search,
                title: 'Smart Matching',
                description: 'Our algorithm matches you with compatible roommates based on lifestyle, preferences, and budget.',
                color: 'text-primary'
              },
              {
                icon: Shield,
                title: 'Verified Profiles',
                description: 'All users are verified for safety. Chat securely and meet with confidence.',
                color: 'text-success'
              },
              {
                icon: MessageCircle,
                title: 'Easy Communication',
                description: 'Built-in chat system to connect with potential roommates and property owners instantly.',
                color: 'text-secondary'
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="card bg-base-200/50 backdrop-blur shadow-xl hover:shadow-2xl transition-all duration-300"
                  variants={fadeInUp}
                  {...scaleOnHover}
                >
                  <div className="card-body text-center">
                    <motion.div 
                      className={`mx-auto mb-4 p-4 rounded-full bg-base-100 w-fit ${feature.color}`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <IconComponent className="w-8 h-8" />
                    </motion.div>
                    <h3 className="card-title justify-center text-2xl mb-2">{feature.title}</h3>
                    <p className="text-base-content/70">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-content">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { number: '10K+', label: 'Happy Users' },
              { number: '5K+', label: 'Rooms Listed' },
              { number: '2K+', label: 'Successful Matches' },
              { number: '50+', label: 'Cities Covered' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="space-y-2"
              >
                <motion.div 
                  className="text-4xl md:text-5xl font-bold"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                  viewport={{ once: true }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-primary-content/80">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-base-200">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-base-content/70">Real stories from real people</p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                name: 'Sarah Johnson',
                role: 'Software Engineer',
                content: 'Found my perfect roommate within a week! The matching system really works.',
                rating: 5
              },
              {
                name: 'Mike Chen',
                role: 'Graduate Student',
                content: 'Safe, reliable, and easy to use. Highly recommend for anyone looking for accommodation.',
                rating: 5
              },
              {
                name: 'Priya Sharma',
                role: 'Marketing Manager',
                content: 'The chat feature made it so easy to connect with potential roommates. Love it!',
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="card bg-base-100 shadow-xl"
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="card-body">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-base-content/80 mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="avatar placeholder mr-4">
                      <div className="bg-primary text-primary-content rounded-full w-12">
                        <span className="text-xl">{testimonial.name[0]}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-base-content/60">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-content">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Find Your Perfect Match?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of happy users who found their ideal living situation through FindaRoomie
            </p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Link to="/register" className="btn btn-accent btn-lg text-white">
                Get Started Free
              </Link>
              <Link to="/rooms" className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary">
                Browse Rooms
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
