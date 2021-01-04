<?php


namespace App\Controller;


use App\Entity\Effect;
use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class HomeController extends AbstractController
{
    /**
     * Shows the dashboard including the key figures.
     *
     * @Route("/susaf", name="app_dashboard")
     */
    public function fetchDashboard(Request $request) : Response
    {
        $userRepository = $this->getDoctrine()->getRepository(User::class);
        $repository = $this->getDoctrine()->getManager()->getRepository(Effect::class);
        $username = $this->getUser()->getUsername();
        $user = $userRepository->findOneBy(
            ['email' => $username]
        );
        return $this->render('dashboard.html.twig', [
            'numberEffects' => count($this->show()),
            'numberLinks' => $repository->getNumberOfLinks($user->getId()),
            'maxDimension' => $repository->getMostCommonDimension($user->getId()),
        ]);
    }

    /**
     * Shows the introduction page.
     *
     * @Route("/susaf/introduction", name="app_introduction")
     */
    public function fetchIntroduction(Request $request) : Response
    {
        return $this->render('introduction.html.twig', []);
    }

    /**
     * Shows the homepage.
     *
     * @Route("/", name="app_homepage")
     */
    public function fetchHomepage(Request $request) : Response
    {
        return $this->render('homepage.html.twig', []);
    }

    /**
     * Shows the privacy policy.
     *
     * @Route("/privacy-policy", name="app_privacy")
     */
    public function fetchPrivacyPolicy(Request $request) : Response
    {
        return $this->render('privacy.html.twig', []);
    }

    /**
     * Shows the terms and conditions page.
     *
     * @Route("/terms-and-conditions", name="app_terms")
     */
    public function fetchTerms(Request $request) : Response
    {
        return $this->render('terms.html.twig', []);
    }

    /**
     *  Finds all the effects pertaining to the logged-in user.
     */
    public function show(){
        $repository = $this->getDoctrine()->getRepository(Effect::class);
        $userRepository = $this->getDoctrine()->getRepository(User::class);
        $userEntity = $userRepository->findOneBy(
            ['email' => $this->getUser()->getUsername()]
        );
        $userId = $userEntity->getId();
        return $repository->findBy(
            ['creator' => $userId]
        );
    }
}