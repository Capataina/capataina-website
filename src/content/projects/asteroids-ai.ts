import type { Project } from "@/types";

export const asteroidsAI: Project = {
  title: "AsteroidsAI — Real-time RL benchmarking across 4 paradigms",
  date: "2024",
  fields: ["Applied AI & ML Infrastructure Engineer"],
  links: {
    github: "https://github.com/Capataina/Asteroids-AI",
  },
  description: [
    "Real-time AI benchmarking platform comparing neuroevolution, genetic algorithms, evolution strategies, and graph-based RL on a continuous-control task under matched conditions",
    "Designed for honest paradigm-vs-paradigm comparison — same environment, same reward, same training budget, so the only thing varying between runs is the learning algorithm",
    "Sparse-reward, real-time decision making — agents don't get gradient information per-frame, so they have to credit-assign over long episodes",
  ],
  techStack: "Python, Arcade, NEAT-Python, DEAP, PyTorch, NumPy",
  technicalDetails: [
    "Four paradigms in one harness: NEAT (topology+weights co-evolution), DEAP-GA (parameter-only evolution), Evolution Strategies (Gaussian noise on parameters), and a Graph Neural Network with Soft Actor-Critic gradient learner",
    "Real-time visualisation of agent learning + decision-making — the user watches both the rewards distribution evolve and the actual in-game behaviour change as training progresses",
    "Performance benchmarking captures wall-clock training time, sample efficiency (episodes-to-threshold), and asymptotic policy quality — the three different axes paradigms typically trade off against",
    "Sparse-reward continuous-control environment exposes the credit-assignment problem cleanly — gradient methods need careful reward shaping, evolutionary methods don't but pay in sample efficiency",
  ],
};
