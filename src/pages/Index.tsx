import { Link } from "react-router-dom";
import { ArrowRight, Code2, Users, Trophy, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParallaxSection } from "@/components/ParallaxSection";
import { GlassCard } from "@/components/GlassCard";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80" />
        
        <ParallaxSection speed={0.3} className="relative z-10 text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 gradient-text animate-fade-in">
              CSE Career Compass
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-slide-up">
              Navigate Your Path to Success with Real Student Experiences
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button asChild size="lg" className="bg-gradient-primary hover:glow-primary transition-all duration-300">
                <Link to="/add-experience">
                  Share Your Experience <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="glass-card hover:glow-accent transition-all duration-300">
                <Link to="/view-experiences">
                  Browse Experiences <BookOpen className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </ParallaxSection>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-float">
          <Code2 className="h-16 w-16 text-primary/30" />
        </div>
        <div className="absolute bottom-20 right-10 animate-float" style={{ animationDelay: '2s' }}>
          <Trophy className="h-12 w-12 text-accent/30" />
        </div>
        <div className="absolute top-1/3 right-20 animate-float" style={{ animationDelay: '1s' }}>
          <Users className="h-14 w-14 text-primary/20" />
        </div>
      </section>

      {/* Guidance Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <ParallaxSection speed={0.2}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="gradient-text">Intern Guidance</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Essential advice from experienced students and professionals
              </p>
            </div>
          </ParallaxSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard className="space-y-6" glow>
              <h3 className="text-2xl font-bold text-primary">General Advice:</h3>
              <div className="space-y-4 text-foreground/90">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p>For DSA, complete all varieties of problems from <strong>Striver Sheet</strong> (standard questions from it are asked a lot in the interviews and OA). People with low CP rating and a little busy, assuming you get interviews you should complete it first before doing anything else.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Fill the priority form in the correct order assuming you will get interviews at all sorts of people but some of the people from low waitlist too and some times there are some updates shortlist as well so you might get shortlisted in a company on the night before its interview. So do fill it considering that you are selected for every company.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Apply at both PIC site and fill the application form too.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Know your project well and fill that you are able to do 35 points on it.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Whatever you want to communicate to pic, tell that do DPR, and prefer gap communicating directly.</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="space-y-6">
              <h3 className="text-2xl font-bold text-accent">Pro Tips:</h3>
              <div className="space-y-4 text-foreground/90">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Sometimes you may not get the company you want, don't get disheartened and sometimes it may be possible that the company invites you to dinner, but still might not hire you so always keep trying for other companies too.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Remember which email ID you used for uploading your resume.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p>You must be able to explain your logic to the interviewer.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p>Don't try to cheat anywhere in a virtual interview or OA process as it can lead to disbarment.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p>In the OAs, due to time constraints, or if you do not get the expected idea, <strong>atleast write a brute force approach</strong>, they pass a reasonable number of test cases, and <strong>they do matter a lot</strong>.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p>In the OAs, <strong>be patient to fully read the question</strong>. They are generally quite big and verbose, but worth the time, as you may skip important information regarding them, and might waste precious time.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-primary rounded-full mt-2 flex-shrink-0" />
                  <p><strong>PS: Things might appear very random at times, but that should not be an excuse to lower your morale.</strong></p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Stats Section
      <section className="py-20 px-4 bg-gradient-secondary">
        <div className="max-w-4xl mx-auto">
          <ParallaxSection speed={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <GlassCard className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">1000+</div>
                <p className="text-muted-foreground">Experiences Shared</p>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">500+</div>
                <p className="text-muted-foreground">Companies Covered</p>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">95%</div>
                <p className="text-muted-foreground">Success Rate</p>
              </GlassCard>
            </div>
          </ParallaxSection>
        </div>
      </section> */}

      {/* CTA Section
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <ParallaxSection speed={0.2}>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
              Ready to Share Your Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Help fellow students by sharing your internship and placement experiences
            </p>
            <Button asChild size="lg" className="bg-gradient-primary hover:glow-primary animate-glow">
              <Link to="/add-experience">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </ParallaxSection>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold gradient-text mb-4">CSE Career Compass</h3>
              <p className="text-muted-foreground">
                Empowering CSE students with real experiences and practical guidance for internships and placements.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/view-experiences" className="block text-muted-foreground hover:text-primary transition-colors">
                  View Experiences
                </Link>
                <Link to="/add-experience" className="block text-muted-foreground hover:text-primary transition-colors">
                  Share Experience
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-2">
                <a href="#" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                  Striver Sheet <ExternalLink className="ml-1 h-4 w-4" />
                </a>
                <a href="#" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                  Interview Tips <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Career Compass. Built with ❤️ for students, by students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
