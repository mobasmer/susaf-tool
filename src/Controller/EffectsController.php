<?php


namespace App\Controller;


use App\Entity\Effect;
use App\Entity\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class EffectsController extends AbstractController
{
    /**
     * @Route("/susaf/effects", name="app_effects")
     */

    //TODO: separate routes for delete selected and delete effect
    public function handleEffects(Request $request) : Response
    {
        if($request->isXmlHttpRequest()){
            $method = $request->get('_method');
            switch($method){
                case 'delete':
                    return $this->deleteEffect($request->get('id'));
                case 'deleteSelected': return $this->deleteEffects($request, $request->get('ids'));
            }
        } else {
                return $this->render('effects.html.twig', [
                //'form' => $form->createView(),
                'effects' => $this->show(),
            ]);
        }
    }

    /**
     * Returns all effects in the database.
     *
     * @return Effect[]|object[]
     */
    public function show(){
        $repository = $this->getDoctrine()->getRepository(Effect::class);
        return $repository->findAll();
    }


    /**
     * Returns all the effects that were created by a specific user.
     *
     * @Route("/susaf/effects/load_effects", name="app_effects_load_effects")
     */
    public function showEffectsWithRelations(Request $request) : Response {
        if($request->isXmlHttpRequest()){
            $repository = $this->getDoctrine()->getRepository(Effect::class);
            $userRepository = $this->getDoctrine()->getRepository(User::class);
            $userEntity = $userRepository->findOneBy(
                ['email' => $this->getUser()->getUsername()]
            );
            $userId = $userEntity->getId();
            $elements = $repository->findBy(
                ['creator' => $userId]
            );

            $response = new JsonResponse(['aaData'=> $elements]);
            $response->setStatusCode(Response::HTTP_OK);
            return $response;
        }

        $response = new Response();
        $response->setStatusCode(Response::HTTP_BAD_REQUEST);
        return $response;
    }

    /**
     * Deletes an effect from the database.
     *
     * @Route("/susaf/effects/delete_effect", name="app_effects_delete_effect", methods="POST")
     */

    //TODO: csrf token checken and validate input
    public function deleteEffect(String $id)
    {
            $em = $this->getDoctrine()->getManager();
            $effect = $em->getRepository(Effect::class)->find($id);
            $em->remove($effect);
            $em->flush();

            $response = new Response();
            $response->setStatusCode(Response::HTTP_OK);
            return $response;
    }

    /**
     * Deletes a number of selected effects from the database.
     *
     * @Route("/susaf/effects/delete_selected", name="app_effects_delete_selected", methods="POST")
     */

    //TODO: check csrf token und validate input
    public function deleteEffects(Request $request, $ids){
        $em = $this->getDoctrine()->getManager();
        $rep = $em->getRepository(Effect::class);

        foreach((array) $ids as $id){
            $eff = $rep->find($id);
            $em->remove($eff);
        }

        $em->flush();

        $response = new Response();
        $response->setStatusCode(Response::HTTP_OK);
        return $response;

    }

    /**
     * Updates the details of an effect, including the relations.
     *
     * @Route("/susaf/effects/update_effect", name="app_effects_update_effect", methods="POST")
     */

    public function update_effect(Request $request):Response{
        $submittedToken = $request->headers->get('x-csrf-token');

        if($request->isXmlHttpRequest() && $this->isCsrfTokenValid('edit-effect', $submittedToken)){
            $id = $request->get('id');
            $entityManager = $this->getDoctrine()->getManager();
            $effect = $entityManager->find(Effect::class, $id);

            $this->update_fields($request, $effect);

            $causes = $request->get('causes');
            $consequences = $request->get('consequences');


            if($causes != null){
                foreach($causes as $id){
                    $cause = $entityManager->find(Effect::class, $id);
                    $effect->addCause($cause);
                }

                $dbCauses = $effect->getCauses();
                foreach($dbCauses as $db){
                    if(!(in_array($db->getId(), $causes))){
                        $effect->removeCause($db);
                    }
                }
            } else {
                $dbCauses = $effect->getCauses();
                foreach($dbCauses as $db){
                    $effect->removeCause($db);
                }
            }

            if($consequences != null){
                foreach($consequences as $id){
                    $consequence = $entityManager->find(Effect::class, $id);
                    $effect->addConsequence($consequence);
                }

                $dbConsequences = $effect->getConsequences();
                foreach($dbConsequences as $db){
                    if(!(in_array($db->getId(), $consequences))){
                        $effect->removeConsequence($db);
                    }
                }
            } else {
                $dbConsequences = $effect->getConsequences();
                foreach($dbConsequences as $db){
                    $effect->removeConsequence($db);
                }
            }


            $entityManager->persist($effect);
            $entityManager->flush();

            $response = new Response();
            $response->setContent($effect->getId());
            $response->setStatusCode(Response::HTTP_OK);
            return $response;
        }

        $response = new Response();
        $response->setStatusCode(Response::HTTP_BAD_REQUEST);
        return $response;

    }

    /**
     * Updates only the dimension and / or order of an effect.
     *
     * @Route("/susaf/effects/update_position", name="app_effects_update_position", methods="POST")
     */

    public function updatePosition(Request $request):Response{
        //$submittedToken = $request->headers->get('x-csrf-token');

        if($request->isXmlHttpRequest()){
            //&& $this->isCsrfTokenValid('edit-effect', $submittedToken)){
            $id = $request->get('id');
            $entityManager = $this->getDoctrine()->getManager();
            $effect = $entityManager->find(Effect::class, $id);

            $dim = $request->get('dimension');
            $order = $request->get('order_of_effect');

            $effect->setOrderOfEffect($order);
            $effect->setDimension($dim);


            $entityManager->persist($effect);
            $entityManager->flush();

            $response = new Response();
            $response->setContent($effect->getId());
            $response->setStatusCode(Response::HTTP_OK);
            return $response;
        }

        $response = new Response();
        $response->setStatusCode(Response::HTTP_BAD_REQUEST);
        return $response;

    }

    /**
     * Creates a new effect and saves it to the database.
     *
     * @Route("/susaf/effects/create_effect", name="app_effects_create_effect", methods="POST")
     */
    public function create_effect(Request $request):Response{
        $submittedToken = $request->headers->get('x-csrf-token');

        if($request->isXmlHttpRequest() && $this->isCsrfTokenValid('create-effect', $submittedToken)){
            $entityManager = $this->getDoctrine()->getManager();
            $effect = new Effect();

            $this->update_fields($request, $effect);

            $causes = $request->get('causes');
            $consequences = $request->get('consequences');


            if($causes != null){
                foreach($causes as $id){
                    $cause = $entityManager->find(Effect::class, $id);
                    $effect->addCause($cause);
                }
            }

            if($consequences != null){
                foreach($consequences as $id){
                $consequence = $entityManager->find(Effect::class, $id);
                $effect->addConsequence($consequence);
            }}

            $entityManager->persist($effect);
            $entityManager->flush();

            $response = new Response();
            $response->setContent($effect->getId());
            $response->setStatusCode(Response::HTTP_CREATED);
            return $response;
        }

        $response = new Response();
        $response->setStatusCode(Response::HTTP_BAD_REQUEST);
        return $response;
    }

    /**
     * Updates the details of an effect.
     */

    private function update_fields(Request $request, Effect $effect) {
            $dim = $request->get('dimension');
            $order = $request->get('order_of_effect');
            $desc = $request->get('description');
            $note = $request->get('note');
            $pos = $request->get('is_positive');

            $sanitized_desc = strip_tags(trim($desc));
            $sanitized_note = strip_tags(trim($note));

            $effect->setDescription($sanitized_desc);
            $effect->setOrderOfEffect($order);
            $effect->setNote($sanitized_note);
            $effect->setDimension($dim);
            $effect->setIsPositive($pos);
            $effect->setCreator($this->getUser());
    }
}