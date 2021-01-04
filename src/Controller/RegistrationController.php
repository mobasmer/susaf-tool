<?php

namespace App\Controller;

use App\Entity\User;
use App\Form\RegistrationFormType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\Bridge\Google\Transport\GmailSmtpTransport;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;
use Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\RedirectionExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\ServerExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;

class RegistrationController extends AbstractController
{
    /**
     * @Route("/register", name="app_register")
     * @throws \Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface
     */
    public function register(/*MailerInterface $mailer,*/ Request $request, UserPasswordEncoderInterface $passwordEncoder): Response
    {
       /* $recaptcha = $request->request->get('g-recaptcha-response');
        $client = HttpClient::create();
        $response = $client->request('POST', 'https://www.google.com/secret=recaptcha/api/siteverify?6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe&response='+ $recaptcha);
*/

        $user = new User();
        $form = $this->createForm(RegistrationFormType::class, $user);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid() /* && json_decode($response->getContent(true))['success']*/) {
            // encode the plain password
            $user->setPassword(
                $passwordEncoder->encodePassword(
                    $user,
                    $form->get('password')->getData()
                )
            );

            $user->setApproved(true);

            $entityManager = $this->getDoctrine()->getManager();
            $entityManager->persist($user);
            $entityManager->flush();

            // do anything else you need here, like send an email
            //$this->sendEmail($mailer);


            return $this->redirectToRoute('app_login');
        }

          /*  $this->addFlash(
                'error',
                'Captcha required'
            );*/


        return $this->render('registration/register.html.twig', [
            'registrationForm' => $form->createView(),
        ]);
    }

    public function sendEmail(MailerInterface $mailer){
        $email = (new Email())
            ->from('')
            ->to('')
            ->subject('New user registered')
            ->text('Grant access to new user!');

        $mailer->send($email);
    }

    /**
     * @Route("/registration-confirmation", name="app_registration_done")
     */
    public function feedback(Request $request){
        return $this->render('registration/register_done.html.twig', []);
    }
}
