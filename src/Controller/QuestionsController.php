<?php


namespace App\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;


class QuestionsController extends AbstractController
{
    /**
     * @Route("/susaf/questions/social-dimension", name="app_social_dimension")
     */
    public function fetchSocialQuestions(Request $request) : Response
    {
        return $this->render('social.html.twig', []);
    }

    /**
     * @Route("/susaf/questions/economic-dimension", name="app_economic_dimension")
     */
    public function fetchEconomicQuestions(Request $request) : Response
    {
        return $this->render('economic.html.twig', []);
    }

    /**
     * @Route("/susaf/questions/technical-dimension", name="app_technical_dimension")
     */
    public function fetchTechnicalQuestions(Request $request) : Response
    {
        return $this->render('technical.html.twig', []);
    }

    /**
     * @Route("/susaf/questions/environmental-dimension", name="app_environmental_dimension")
     */
    public function fetchEnvironmentalQuestions(Request $request) : Response
    {
        return $this->render('environmental.html.twig', []);
    }

    /**
     * @Route("/susaf/questions/individual-dimension", name="app_individual_dimension")
     */
    public function fetchIndividualQuestions(Request $request) : Response
    {
        return $this->render('individual.html.twig', []);
    }

}