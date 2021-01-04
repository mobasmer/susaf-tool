<?php

namespace App\Controller;

use App\Entity\Effect;
use App\Form\EffectType;
use App\Repository\EffectRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;


/* Not in use, please view EffectsController */


/**
 * @Route("/effect")
 */
class EffectController extends AbstractController
{
    /**
     * @Route("/", name="effect_index", methods={"GET"})
     */
    public function index(EffectRepository $effectRepository): Response
    {
        return $this->render('effect/index.html.twig', [
            'effects' => $effectRepository->findAll(),
        ]);
    }

    /**
     * @Route("/new", name="effect_new", methods={"GET","POST"})
     */
    public function new(Request $request): Response
    {
        $effect = new Effect();
        $form = $this->createForm(EffectType::class, $effect);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager = $this->getDoctrine()->getManager();
            $entityManager->persist($effect);
            $entityManager->flush();

            return $this->redirectToRoute('effect_index');
        }

        return $this->render('effect/new.html.twig', [
            'effect' => $effect,
            'form' => $form->createView(),
        ]);
    }

    /**
     * @Route("/{id}", name="effect_show", methods={"GET"})
     */
    public function show(Effect $effect): Response
    {
        return $this->render('effect/show.html.twig', [
            'effect' => $effect,
        ]);
    }

    /**
     * @Route("/{id}/edit", name="effect_edit", methods={"GET","POST"})
     */
    public function edit(Request $request, Effect $effect): Response
    {
        $form = $this->createForm(EffectType::class, $effect);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $this->getDoctrine()->getManager()->flush();

            return $this->redirectToRoute('effect_index');
        }

        return $this->render('effect/edit.html.twig', [
            'effect' => $effect,
            'form' => $form->createView(),
        ]);
    }

    /**
     * @Route("/{id}", name="effect_delete", methods={"DELETE"})
     */
    public function delete(Request $request, Effect $effect): Response
    {
        if ($this->isCsrfTokenValid('delete'.$effect->getId(), $request->request->get('_token'))) {
            $entityManager = $this->getDoctrine()->getManager();
            $entityManager->remove($effect);
            $entityManager->flush();
        }

        return $this->redirectToRoute('effect_index');
    }
}
