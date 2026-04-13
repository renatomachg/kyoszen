// Shared types for the Kyoszen application

export interface Vacancy {
  id: number;
  title: string;
  category: string;
  location: string;
  contractType: string;
  salary: number;
  badge: string;
  badgeClass: string;
  description: string;
  tags: string[];
}

export interface Course {
  id: number;
  category: string;
  title: string;
  initials: string;
  color: string;
  iconColor: string;
  badge: string | null;
  hours: number;
  description: string;
}

export interface Testimonial {
  text: string;
  name: string;
  role: string;
  image: string;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  privacy: boolean;
}
