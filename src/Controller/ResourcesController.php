<?php


namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class ResourcesController
 * @package App\Controller
 *
 * Manages the pages belonging to the category resources and returns them upon request.
 */

class ResourcesController extends AbstractController
{
    /**
     * @Route("/susaf/resources/sustainability", name="app_sustainability")
     */
    public function fetchResources(Request $request) : Response
    {
        return $this->render('sustainability.html.twig', []);
    }

    /**
     * @Route("/susaf/resources/tutorial", name="app_tutorial")
     */
    public function fetchTutorial(Request $request) : Response
    {
        return $this->render('tutorial.html.twig', []);
    }
}